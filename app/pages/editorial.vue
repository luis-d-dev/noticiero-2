<script setup lang="ts">
import type { Enlace, Noticia } from "~/types/noticia"

const { reporter, comprobado, comprobar } = useReporter()
const noticiasEditoriales = ref<Array<Noticia & { contenido: string; enlaces: Enlace[] }>>([])
const enviando = ref(false)
const errorMensaje = ref("")
const exitoMensaje = ref("")

onMounted(async () => {
  if (!comprobado.value) await comprobar()
})

watch([comprobado, reporter], async ([ok, usuario]) => {
  if (!ok) return
  if (!usuario) {
    await navigateTo("/ingresar?redirigir=/editorial")
    return
  }
  if (usuario.role !== "editor") {
    await navigateTo("/panel")
    return
  }
  await cargarNoticiasEditoriales()
}, { immediate: true })

function mensajeDeError(error: unknown) {
  const posible = error as { data?: { statusMessage?: string; message?: string }; message?: string }
  return posible.data?.statusMessage || posible.data?.message || posible.message || "Ocurrió un error inesperado."
}

async function cargarNoticiasEditoriales() {
  try {
    const noticias = await $fetch<Noticia[]>("/api/editor/noticias")
    noticiasEditoriales.value = noticias.map(noticia => ({
      ...noticia,
      contenido: noticia.contenido || "",
      enlaces: noticia.enlaces ? noticia.enlaces.map(enlace => ({ ...enlace })) : []
    }))
  } catch (error) {
    errorMensaje.value = mensajeDeError(error)
  }
}

async function guardarEdicion(noticia: Noticia & { contenido: string; enlaces: Enlace[] }) {
  enviando.value = true
  errorMensaje.value = ""
  exitoMensaje.value = ""
  try {
    const actualizada = await $fetch<Noticia>(`/api/editor/noticias/${noticia.slug}`, {
      method: "PATCH",
      body: {
        titulo: noticia.titulo,
        resumen: noticia.resumen,
        contenido: noticia.contenido,
        enlaces: noticia.enlaces?.length ? noticia.enlaces : undefined,
        aprobada: noticia.aprobada
      }
    })
    Object.assign(noticia, actualizada, { contenido: actualizada.contenido || "", enlaces: actualizada.enlaces || [] })
    exitoMensaje.value = `Se guardaron los cambios de “${noticia.titulo}”.`
  } catch (error) {
    errorMensaje.value = mensajeDeError(error)
  } finally {
    enviando.value = false
  }
}

async function eliminarNoticia(noticia: Noticia) {
  if (!window.confirm(`¿Eliminar definitivamente “${noticia.titulo}”? Esta acción no se puede deshacer.`)) return

  enviando.value = true
  errorMensaje.value = ""
  exitoMensaje.value = ""
  try {
    await $fetch(`/api/editor/noticias/${noticia.slug}`, { method: "DELETE" })
    noticiasEditoriales.value = noticiasEditoriales.value.filter(item => item.slug !== noticia.slug)
    exitoMensaje.value = `Se eliminó “${noticia.titulo}”.`
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

      <section v-else class="publisher editor-panel">
        <header class="publisher__header">
          <div>
            <p class="eyebrow">Sección editorial</p>
            <h1>Revisión de noticias</h1>
            <p>Hola, {{ reporter?.nombre }}. Revisa el contenido antes de aprobarlo.</p>
          </div>
        </header>

        <p v-if="errorMensaje" class="form-message form-message--error" role="alert">{{ errorMensaje }}</p>
        <p v-if="exitoMensaje" class="form-message form-message--success" role="status">{{ exitoMensaje }}</p>
        <p v-if="!noticiasEditoriales.length" class="editor-empty">No hay noticias pendientes de revisión.</p>

        <article v-for="noticia in noticiasEditoriales" :key="noticia._id" class="editor-card">
          <div class="editor-card__heading">
            <div>
              <p class="eyebrow">{{ noticia.categoria }} · {{ noticia.autorNombre }}</p>
              <label>
                Título
                <input v-model.trim="noticia.titulo" type="text" minlength="5" maxlength="140" required>
              </label>
            </div>
            <img :src="noticia.imagenUrl" :alt="`Portada de ${noticia.titulo}`">
          </div>
          <label>
            Resumen
            <textarea v-model.trim="noticia.resumen" rows="3" minlength="10" maxlength="300" required></textarea>
          </label>
          <label>
            Contenido (opcional)
            <textarea v-model.trim="noticia.contenido" rows="8" minlength="30" maxlength="20000"></textarea>
          </label>
          <fieldset class="field-wide enlaces-field">
            <legend>Enlaces relacionados</legend>
            <div v-for="(enlace, i) in noticia.enlaces" :key="i" class="enlace-row">
              <input v-model.trim="enlace.nombre" type="text" placeholder="Nombre del enlace" maxlength="200">
              <input v-model.trim="enlace.url" type="url" placeholder="https://…" maxlength="2000">
              <button type="button" class="text-button text-button--danger" @click="noticia.enlaces.splice(i, 1)">Quitar</button>
            </div>
            <button type="button" class="text-button" @click="noticia.enlaces.push({ nombre: '', url: '' })">+ Agregar enlace</button>
          </fieldset>
          <label class="approval-field">
            <input v-model="noticia.aprobada" type="checkbox">
            Aprobada y visible públicamente
          </label>
          <div class="editor-card__actions">
            <button class="button" type="button" :disabled="enviando" @click="guardarEdicion(noticia)">
              {{ enviando ? "Procesando…" : "Guardar revisión" }}
            </button>
            <button class="button button--danger" type="button" :disabled="enviando" @click="eliminarNoticia(noticia)">
              Eliminar noticia
            </button>
          </div>
        </article>
      </section>
    </main>
  </div>
</template>