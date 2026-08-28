<script setup lang="ts">
import type { Noticia, Usuario } from "~/types/noticia"

const route = useRoute()
const { data, error } = await useFetch<{ usuario: Usuario; noticias: Noticia[] }>(`/api/usuarios/${route.params.slug}`)

if (error.value) {
  throw createError({ statusCode: error.value.statusCode || 404, statusMessage: "Perfil no encontrado." })
}

useSeoMeta({
  title: () => `Perfil de ${data.value?.usuario?.nombre ?? ""} · Noticiero Maesvida`,
  description: () => data.value?.usuario?.bio || `Perfil de ${data.value?.usuario?.nombre ?? ""} en Noticiero Maesvida.`
})
</script>

<template>
  <div>
    <SiteHeader />
    <main v-if="data" class="profile-page">
      <section class="profile-card container">
        <div class="profile-card__avatar">
          <img
            v-if="data.usuario.fotoUrl"
            :src="data.usuario.fotoUrl"
            :alt="`Foto de perfil de ${data.usuario.nombre}`"
          >
          <span v-else aria-hidden="true">{{ data.usuario.nombre.charAt(0).toUpperCase() }}</span>
        </div>
        <div class="profile-card__info">
          <p class="eyebrow">{{ data.usuario.role === 'editor' ? 'Editor' : 'Reportero' }}</p>
          <h1>{{ data.usuario.nombre }}</h1>
          <p v-if="data.usuario.bio" class="profile-card__bio">{{ data.usuario.bio }}</p>
          <p v-else class="profile-card__bio profile-card__bio--empty">
            Este {{ data.usuario.role === 'editor' ? 'editor' : 'reportero' }} aún no ha escrito una biografía.
          </p>
        </div>
      </section>

      <section class="profile-news container">
        <h2>Noticias publicadas</h2>
        <p v-if="!data.noticias.length" class="profile-news__empty">
          {{ data.usuario.nombre }} aún no tiene noticias publicadas.
        </p>

        <div v-else class="profile-news__grid">
          <NuxtLink
            v-for="noticia in data.noticias"
            :key="noticia._id"
            class="news-card"
            :to="noticia.contenido ? `/noticias/${noticia.slug}` : `/#noticias`"
          >
            <div class="news-card__media" :style="{ backgroundImage: `url(${noticia.imagenUrl})` }">
              <span class="news-card__categoria">{{ noticia.categoria }}</span>
              <button v-if="!noticia.contenido" class="news-card__solo-portada" type="button">Solo portada</button>
              <span v-else class="news-card__leer">Leer →</span>
            </div>
            <div class="news-card__body">
              <h3>{{ noticia.titulo }}</h3>
              <p>{{ noticia.resumen }}</p>
              <time :datetime="noticia.publicadaEn">
                {{ new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(new Date(noticia.publicadaEn)) }}
              </time>
            </div>
          </NuxtLink>
        </div>
      </section>
    </main>
  </div>
</template>
