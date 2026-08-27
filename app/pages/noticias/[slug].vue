<script setup lang="ts">
import type { Noticia } from "~/types/noticia"

const route = useRoute()
const { data: noticia, error } = await useFetch<Noticia>(`/api/noticias/${route.params.slug}`)

if (error.value) {
  throw createError({ statusCode: error.value.statusCode || 404, statusMessage: "Noticia no encontrada" })
}

useSeoMeta({
  title: () => noticia.value ? `${noticia.value.titulo} · Noticiero Maesvida` : "Noticiero Maesvida",
  description: () => noticia.value?.resumen,
  ogImage: () => noticia.value?.imagenUrl
})
</script>

<template>
  <div>
    <SiteHeader />
    <main v-if="noticia" class="article-page">
      <header class="article-hero" :style="{ backgroundImage: `url(${noticia.imagenUrl})` }">
        <div class="article-hero__shade" />
        <div class="article-hero__copy container">
          <p class="eyebrow">{{ noticia.categoria }}</p>
          <h1>{{ noticia.titulo }}</h1>
          <p>{{ noticia.resumen }}</p>
        </div>
      </header>
      <article class="article-body container">
        <div class="article-meta">
          <span>Por {{ noticia.autorNombre }}</span>
          <time :datetime="noticia.publicadaEn">
            {{ new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(new Date(noticia.publicadaEn)) }}
          </time>
        </div>
        <p v-for="(parrafo, indice) in noticia.contenido?.split(/\n{2,}/)" :key="indice">{{ parrafo }}</p>
        <NuxtLink to="/" class="back-link">← Volver a todas las noticias</NuxtLink>
      </article>
    </main>
  </div>
</template>
