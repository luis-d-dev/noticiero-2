<script setup lang="ts">
import type { Noticia } from "~/types/noticia"

const props = defineProps<{ noticias: Noticia[] }>()
const carrusel = ref<HTMLElement | null>(null)
const activa = ref(0)
let temporizador: ReturnType<typeof setInterval> | undefined

function irA(indice: number) {
  const elemento = carrusel.value
  if (!elemento || props.noticias.length === 0) return

  activa.value = (indice + props.noticias.length) % props.noticias.length
  const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  elemento.scrollTo({
    left: activa.value * elemento.clientWidth,
    behavior: reducirMovimiento ? "auto" : "smooth"
  })
}

function sincronizarIndice() {
  const elemento = carrusel.value
  if (!elemento?.clientWidth) return
  activa.value = Math.round(elemento.scrollLeft / elemento.clientWidth)
}

onMounted(() => {
  if (props.noticias.length > 1) {
    temporizador = setInterval(() => irA(activa.value + 1), 6000)
  }
})

onBeforeUnmount(() => {
  if (temporizador) clearInterval(temporizador)
})
</script>

<template>
  <section id="noticias" class="carousel-shell" aria-label="Noticias destacadas">
    <div ref="carrusel" class="carousel" @scroll.passive="sincronizarIndice">
      <article
        v-for="noticia in noticias"
        :key="noticia._id"
        class="news-slide"
        :style="{ backgroundImage: `url(${noticia.imagenUrl})` }"
      >
        <div class="slide-shade" />
        <div class="slide-copy">
          <p class="news-label">Noticia</p>
          <h2>{{ noticia.titulo }}</h2>
          <p>{{ noticia.resumen }}</p>
          <NuxtLink v-if="noticia.contenido" :to="`/noticias/${noticia.slug}`" class="button">Leer más</NuxtLink>
        </div>
      </article>
    </div>

    <template v-if="noticias.length > 1">
      <button class="carousel-arrow carousel-arrow--left" type="button" aria-label="Noticia anterior" @click="irA(activa - 1)">‹</button>
      <button class="carousel-arrow carousel-arrow--right" type="button" aria-label="Noticia siguiente" @click="irA(activa + 1)">›</button>
      <div class="carousel-dots" aria-label="Seleccionar noticia">
        <button
          v-for="(_, indice) in noticias"
          :key="indice"
          type="button"
          :class="{ active: indice === activa }"
          :aria-label="`Ir a la noticia ${indice + 1}`"
          :aria-current="indice === activa ? 'true' : undefined"
          @click="irA(indice)"
        />
      </div>
    </template>
  </section>
</template>
