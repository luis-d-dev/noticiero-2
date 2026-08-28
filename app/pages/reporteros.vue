<script setup lang="ts">
import { uploadPresigned } from "@vercel/blob/client"
import type { Noticia } from "~/types/noticia"

const { reporter, comprobado, comprobar, salir } = useReporter()
const credenciales = reactive({ email: "", password: "" })
const formulario = reactive({ titulo: "", resumen: "", contenido: "", categoria: "Comunidad" })
const portada = ref<File | null>(null)
const enviando = ref(false)
const errorMensaje = ref("")
const exitoMensaje = ref("")
const noticiasEditoriales = ref<Array<Noticia & { contenido: string }>>([])

const tamanoMaximoPortada = 10 * 1024 * 1024
const tamanoObjetivoPortada = 9 * 1024 * 1024
const dimensionMaximaPortada = 1800

onMounted(async () => {
  await comprobar()
  if (reporter.value?.role === "editor") await cargarNoticiasEditoriales()
})

async function cargarNoticiasEditoriales() {
  try {
    const noticias = await $fetch<Noticia[]>("/api/editor/noticias")
    noticiasEditoriales.value = noticias.map(noticia => ({ ...noticia, contenido: noticia.contenido || "" }))
  } catch (error) {
    errorMensaje.value = mensajeDeError(error)
  }
}

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

async function ingresar() {
  enviando.value = true
  errorMensaje.value = ""
  try {
    const respuesta = await $fetch<{ user: typeof reporter.value }>("/api/auth/login", {
      method: "POST",
      body: credenciales
    })
    reporter.value = respuesta.user
    credenciales.password = ""
    if (reporter.value?.role === "editor") await cargarNoticiasEditoriales()
  } catch (error) {
    errorMensaje.value = mensajeDeError(error)
  } finally {
    enviando.value = false
  }
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
      body: { ...formulario, imagenUrl: blob.url }
    })

    exitoMensaje.value = resultadoPortada.optimizada
      ? "La portada fue optimizada y la noticia se envió para aprobación editorial."
      : "La noticia se envió para aprobación editorial."
    if (reporter.value?.role === "editor") await cargarNoticiasEditoriales()
    Object.assign(formulario, { titulo: "", resumen: "", contenido: "", categoria: "Comunidad" })
    portada.value = null
    const input = document.querySelector<HTMLInputElement>("#portada")
    if (input) input.value = ""
  } catch (error) {
    errorMensaje.value = mensajeDeError(error)
  } finally {
    enviando.value = false
  }
}

async function guardarEdicion(noticia: Noticia & { contenido: string }) {
  enviando.value = true
  errorMensaje.value = ""
  exitoMensaje.value = ""
  try {
    const actualizada = await $fetch<Noticia>(`/api/editor/noticias/${noticia.slug}`, {
      method: "PATCH",
      body: { contenido: noticia.contenido, aprobada: noticia.aprobada }
    })
    Object.assign(noticia, actualizada, { contenido: actualizada.contenido || "" })
    exitoMensaje.value = `Se guardaron los cambios de “${noticia.titulo}”.`
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

      <section v-else-if="!reporter" class="auth-card">
        <p class="eyebrow">Área privada</p>
        <h1>Acceso para reporteros</h1>
        <p>Ingresa con las credenciales creadas por el administrador.</p>
        <form @submit.prevent="ingresar">
          <label>
            Correo electrónico
            <input v-model.trim="credenciales.email" type="email" autocomplete="email" required>
          </label>
          <label>
            Contraseña
            <input v-model="credenciales.password" type="password" autocomplete="current-password" minlength="6" required>
          </label>
          <p v-if="errorMensaje" class="form-message form-message--error" role="alert">{{ errorMensaje }}</p>
          <button class="button" type="submit" :disabled="enviando">
            {{ enviando ? "Ingresando…" : "Ingresar" }}
          </button>
        </form>
      </section>

      <template v-else>
      <section class="publisher">
        <header class="publisher__header">
          <div>
            <p class="eyebrow">Panel de publicación</p>
            <h1>Nueva noticia</h1>
            <p>Hola, {{ reporter.nombre }}. Completa la información para publicar.</p>
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
          <p v-if="errorMensaje" class="form-message form-message--error field-wide" role="alert">{{ errorMensaje }}</p>
          <p v-if="exitoMensaje" class="form-message form-message--success field-wide" role="status">{{ exitoMensaje }}</p>
          <button class="button field-wide" type="submit" :disabled="enviando">
            {{ enviando ? "Enviando…" : "Enviar a revisión" }}
          </button>
        </form>
      </section>

      <section v-if="reporter.role === 'editor'" class="publisher editor-panel">
        <header class="publisher__header">
          <div>
            <p class="eyebrow">Panel editorial</p>
            <h1>Revisión de noticias</h1>
            <p>Hola, {{ reporter.nombre }}. Revisa el contenido antes de aprobarlo.</p>
          </div>
        </header>

        <p v-if="errorMensaje" class="form-message form-message--error" role="alert">{{ errorMensaje }}</p>
        <p v-if="exitoMensaje" class="form-message form-message--success" role="status">{{ exitoMensaje }}</p>
        <p v-if="!noticiasEditoriales.length" class="editor-empty">No hay noticias pendientes de revisión.</p>

        <article v-for="noticia in noticiasEditoriales" :key="noticia._id" class="editor-card">
          <div class="editor-card__heading">
            <div>
              <p class="eyebrow">{{ noticia.categoria }} · {{ noticia.autorNombre }}</p>
              <h2>{{ noticia.titulo }}</h2>
              <p>{{ noticia.resumen }}</p>
            </div>
            <img :src="noticia.imagenUrl" :alt="`Portada de ${noticia.titulo}`">
          </div>
          <label>
            Contenido (opcional)
            <textarea v-model.trim="noticia.contenido" rows="8" minlength="30" maxlength="20000"></textarea>
          </label>
          <label class="approval-field">
            <input v-model="noticia.aprobada" type="checkbox">
            Aprobada y visible públicamente
          </label>
          <button class="button" type="button" :disabled="enviando" @click="guardarEdicion(noticia)">
            {{ enviando ? "Guardando…" : "Guardar revisión" }}
          </button>
        </article>
      </section>
      </template>
    </main>
  </div>
</template>
