<script setup lang="ts">
import { uploadPresigned } from "@vercel/blob/client"
import type { Usuario } from "~/types/noticia"

const { reporter, comprobado, comprobar } = useReporter()
const perfil = ref<Usuario | null>(null)
const bioLocal = ref("")
const fotoLocal = ref<File | null>(null)
const fotoPreview = ref<string | null>(null)
const enviando = ref(false)
const errorMensaje = ref("")
const exitoMensaje = ref("")

const tamanoMaximoFoto = 5 * 1024 * 1024
const dimensionMaximaFoto = 1200

onMounted(async () => {
  if (!comprobado.value) await comprobar()
})

watch([comprobado, reporter], async ([ok, usuario]) => {
  if (!ok) return
  if (!usuario) {
    await navigateTo("/ingresar?redirigir=/mi-perfil")
    return
  }
  await cargarPerfil()
}, { immediate: true })

function mensajeDeError(error: unknown) {
  const posible = error as { data?: { statusMessage?: string; message?: string }; message?: string }
  return posible.data?.statusMessage || posible.data?.message || posible.message || "Ocurrió un error inesperado."
}

async function cargarPerfil() {
  try {
    const respuesta = await $fetch<{ usuario: Usuario }>("/api/perfil")
    perfil.value = respuesta.usuario
    bioLocal.value = respuesta.usuario.bio
  } catch (error) {
    errorMensaje.value = mensajeDeError(error)
  }
}

function lienzoABlob(canvas: HTMLCanvasElement, calidad: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error("No se pudo procesar la foto de perfil.")),
      "image/webp",
      calidad
    )
  })
}

function seleccionarFoto(evento: Event) {
  const input = evento.target as HTMLInputElement
  const archivo = input.files?.[0] || null
  if (fotoPreview.value) URL.revokeObjectURL(fotoPreview.value)
  fotoLocal.value = archivo
  fotoPreview.value = archivo ? URL.createObjectURL(archivo) : null
}

async function optimizarFoto(archivo: File) {
  const imagen = await createImageBitmap(archivo)
  try {
    if (archivo.size <= tamanoMaximoFoto && imagen.width <= dimensionMaximaFoto && imagen.height <= dimensionMaximaFoto) {
      return { archivo, optimizada: false }
    }

    const escala = Math.min(1, dimensionMaximaFoto / Math.max(imagen.width, imagen.height))
    const ancho = Math.max(1, Math.round(imagen.width * escala))
    const alto = Math.max(1, Math.round(imagen.height * escala))
    const canvas = document.createElement("canvas")
    canvas.width = ancho
    canvas.height = alto
    const contexto = canvas.getContext("2d")
    if (!contexto) throw new Error("El navegador no pudo procesar la foto.")
    contexto.drawImage(imagen, 0, 0, ancho, alto)
    const blob = await lienzoABlob(canvas, 0.85)
    const nombre = archivo.name.replace(/\.[^.]+$/, "") || "perfil"
    return {
      archivo: new File([blob], `${nombre}.webp`, { type: "image/webp", lastModified: Date.now() }),
      optimizada: true
    }
  } finally {
    imagen.close()
  }
}

async function guardarPerfil() {
  enviando.value = true
  errorMensaje.value = ""
  exitoMensaje.value = ""
  try {
    let fotoUrl = perfil.value?.fotoUrl || ""
    if (fotoLocal.value) {
      const resultado = await optimizarFoto(fotoLocal.value)
      const blob = await uploadPresigned(`perfiles/${reporter.value?.slug || "usuario"}/${resultado.archivo.name}`, resultado.archivo, {
        access: "public",
        handleUploadUrl: "/api/uploads/foto",
        clientPayload: JSON.stringify({ nombre: reporter.value?.nombre })
      })
      fotoUrl = blob.url
    }

    const respuesta = await $fetch<{ usuario: Usuario }>("/api/perfil", {
      method: "PATCH",
      body: { bio: bioLocal.value, fotoUrl }
    })
    perfil.value = respuesta.usuario
    bioLocal.value = respuesta.usuario.bio
    if (fotoPreview.value) {
      URL.revokeObjectURL(fotoPreview.value)
      fotoPreview.value = null
    }
    fotoLocal.value = null
    const input = document.querySelector<HTMLInputElement>("#foto-perfil")
    if (input) input.value = ""
    exitoMensaje.value = "Tu perfil se actualizó correctamente."
  } catch (error) {
    errorMensaje.value = mensajeDeError(error)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="reporter-page">
    <SiteHeader />
    <main class="panel container">
      <div v-if="!comprobado" class="loader" aria-label="Comprobando sesión" />

      <section v-else class="publisher profile-panel">
        <header class="publisher__header">
          <div>
            <p class="eyebrow">Mi perfil</p>
            <h1>Tu página de perfil</h1>
            <p>Completa tu biografía y sube una foto. Estos datos son públicos.</p>
            <NuxtLink v-if="reporter?.slug" :to="`/usuarios/${reporter.slug}`" class="text-button">Ver mi perfil público →</NuxtLink>
          </div>
        </header>

        <form class="publisher-form" @submit.prevent="guardarPerfil">
          <label class="field-wide">
            Biografía
            <textarea v-model.trim="bioLocal" rows="5" maxlength="500" placeholder="Cuéntanos quién eres y qué cubres…"></textarea>
            <small>Máximo 500 caracteres.</small>
          </label>
          <label class="field-wide">
            Foto de perfil
            <input id="foto-perfil" type="file" accept="image/jpeg,image/png,image/webp" @change="seleccionarFoto">
            <small>JPG, PNG o WebP, máximo 5 MB.</small>
          </label>
          <div class="profile-preview field-wide">
            <p v-if="!fotoPreview && !perfil?.fotoUrl" class="profile-preview__placeholder">Sin foto de perfil</p>
            <span v-else class="profile-preview__thumb">
              <img v-if="fotoPreview" :src="fotoPreview" alt="Vista previa de tu foto">
              <img v-else :src="perfil?.fotoUrl" alt="Foto de perfil actual">
            </span>
          </div>
          <p v-if="errorMensaje" class="form-message form-message--error field-wide" role="alert">{{ errorMensaje }}</p>
          <p v-if="exitoMensaje" class="form-message form-message--success field-wide" role="status">{{ exitoMensaje }}</p>
          <button class="button field-wide" type="submit" :disabled="enviando">
            {{ enviando ? "Guardando…" : "Guardar perfil" }}
          </button>
        </form>
      </section>
    </main>
  </div>
</template>