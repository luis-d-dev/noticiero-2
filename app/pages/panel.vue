<script setup lang="ts">
import { uploadPresigned } from "@vercel/blob/client"

const { reporter, comprobado, comprobar, salir } = useReporter()
const formulario = reactive({ titulo: "", resumen: "", contenido: "", categoria: "Comunidad" })
const enlaces = ref<Array<{ nombre: string; url: string }>>([])
const portada = ref<File | null>(null)
const enviando = ref(false)
const errorMensaje = ref("")
const exitoMensaje = ref("")

const tamanoMaximoPortada = 10 * 1024 * 1024
const tamanoObjetivoPortada = 9 * 1024 * 1024
const dimensionMaximaPortada = 1800

onMounted(async () => {
  if (!comprobado.value) await comprobar()
})

watch([comprobado, reporter], ([ok, usuario]) => {
  if (!ok) return
  if (!usuario) navigateTo("/ingresar?redirigir=/panel")
}, { immediate: true })

function seleccionarPortada(evento: Event) {
  const input = evento.target as HTMLInputElement
  portada.value = input.files?.[0] || null
}

function mensajeDeError(error: unknown) {
  const posible = error as { data?: { statusMessage?: string; message?: string }; message?: string }
  return posible.data?.statusMessage || posible.data?.message || posible.message || "Ocurrió un error inesperado."
}

function lienzoABlob(canvas: HTMLCanvasElement, calidad: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error("No se pudo procesar la imagen de portada.")),
      "image/webp",
      calidad
    )
  })
}

async function optimizarPortada(archivo: File) {
  const imagen = await createImageBitmap(archivo)
  try {
    if (
      archivo.size <= tamanoMaximoPortada &&
      imagen.width <= dimensionMaximaPortada &&
      imagen.height <= dimensionMaximaPortada
    ) {
      return { archivo, optimizada: false }
    }

    const escalaInicial = Math.min(1, dimensionMaximaPortada / Math.max(imagen.width, imagen.height))
    let ancho = Math.max(1, Math.round(imagen.width * escalaInicial))
    let alto = Math.max(1, Math.round(imagen.height * escalaInicial))
    let calidad = 0.86

    for (let intento = 0; intento < 8; intento++) {
      const canvas = document.createElement("canvas")
      canvas.width = ancho
      canvas.height = alto
      const contexto = canvas.getContext("2d")
      if (!contexto) throw new Error("El navegador no pudo procesar la imagen.")

      contexto.drawImage(imagen, 0, 0, ancho, alto)
      const blob = await lienzoABlob(canvas, calidad)
      if (blob.size <= tamanoObjetivoPortada) {
        const nombre = archivo.name.replace(/\.[^.]+$/, "") || "portada"
        return {
          archivo: new File([blob], `${nombre}.webp`, { type: "image/webp", lastModified: Date.now() }),
          optimizada: true
        }
      }

      ancho = Math.max(1, Math.round(ancho * 0.8))
      alto = Math.max(1, Math.round(alto * 0.8))
      calidad = Math.max(0.55, calidad - 0.08)
    }
  } finally {
    imagen.close()
  }

  throw new Error("La imagen es demasiado grande y no se pudo reducir por debajo de 10 MB.")
}

async function publicar() {
  if (!portada.value) {
    errorMensaje.value = "Selecciona una imagen de portada."
    return
  }

  enviando.value = true
  errorMensaje.value = ""
  exitoMensaje.value = ""

  try {
    const resultadoPortada = await optimizarPortada(portada.value)
    const archivo = resultadoPortada.archivo
    const slugArchivo = formulario.titulo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "noticia"

    const blob = await uploadPresigned(`noticias/${slugArchivo}/${archivo.name}`, archivo, {
      access: "public",
      handleUploadUrl: "/api/uploads/portada",
      clientPayload: JSON.stringify({ titulo: formulario.titulo })
    })

    await $fetch<{ slug: string }>("/api/noticias", {
      method: "POST",
      body: { ...formulario, imagenUrl: blob.url, enlaces: enlaces.value.length ? enlaces.value : undefined }
    })

    exitoMensaje.value = resultadoPortada.optimizada
      ? "La portada fue optimizada y la noticia se envió para aprobación editorial."
      : "La noticia se envió para aprobación editorial."
    Object.assign(formulario, { titulo: "", resumen: "", contenido: "", categoria: "Comunidad" })
    enlaces.value = []
    portada.value = null
    const input = document.querySelector<HTMLInputElement>("#portada")
    if (input) input.value = ""
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

      <section v-else class="publisher">
        <header class="publisher__header">
          <div>
            <p class="eyebrow">Panel de publicación</p>
            <h1>Nueva noticia</h1>
            <p>Hola, {{ reporter?.nombre }}. Completa la información para publicar.</p>
          </div>
          <button class="text-button" type="button" @click="salir">Cerrar sesión</button>
        </header>

        <form class="publisher-form" @submit.prevent="publicar">
          <label class="field-wide">
            Título
            <input v-model.trim="formulario.titulo" type="text" minlength="5" maxlength="140" required>
          </label>
          <label>
            Categoría
            <input v-model.trim="formulario.categoria" type="text" maxlength="40" required>
          </label>
          <label>
            Imagen de portada
            <input id="portada" type="file" accept="image/jpeg,image/png,image/webp" required @change="seleccionarPortada">
            <small>JPG, PNG o WebP, máximo 10 MB.</small>
          </label>
          <label class="field-wide">
            Resumen
            <textarea v-model.trim="formulario.resumen" rows="3" minlength="10" maxlength="300" required></textarea>
          </label>
          <label class="field-wide">
            Contenido (opcional)
            <textarea v-model.trim="formulario.contenido" rows="12" minlength="30" maxlength="20000"></textarea>
            <small>Si lo dejas vacío, se publicará únicamente la portada y no habrá una página de ampliación.</small>
          </label>
          <fieldset class="field-wide enlaces-field">
            <legend>Enlaces relacionados (opcional)</legend>
            <p class="enlaces-hint">Agrega enlaces para que los lectores encuentren contenido relacionado.</p>
            <div v-for="(enlace, i) in enlaces" :key="i" class="enlace-row">
              <input v-model.trim="enlace.nombre" type="text" placeholder="Nombre del enlace" maxlength="200">
              <input v-model.trim="enlace.url" type="url" placeholder="https://…" maxlength="2000">
              <button type="button" class="text-button text-button--danger" @click="enlaces.splice(i, 1)">Quitar</button>
            </div>
            <button type="button" class="text-button" @click="enlaces.push({ nombre: '', url: '' })">+ Agregar enlace</button>
          </fieldset>
          <p v-if="errorMensaje" class="form-message form-message--error field-wide" role="alert">{{ errorMensaje }}</p>
          <p v-if="exitoMensaje" class="form-message form-message--success field-wide" role="status">{{ exitoMensaje }}</p>
          <button class="button field-wide" type="submit" :disabled="enviando">
            {{ enviando ? "Enviando…" : "Enviar a revisión" }}
          </button>
        </form>
      </section>
    </main>
  </div>
</template>