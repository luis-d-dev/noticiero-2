<script setup lang="ts">
import type { Noticia } from "~/types/noticia"

const { data: noticias, status, error, refresh } = await useFetch<Noticia[]>("/api/noticias")
</script>

<template>
  <div class="home-page">
    <SiteHeader transparente />

    <main>
      <NewsCarousel v-if="noticias?.length" :noticias="noticias" />
      <section v-else class="empty-state">
        <div v-if="status === 'pending'" class="loader" aria-label="Cargando noticias" />
        <template v-else-if="error">
          <h1>No pudimos cargar las noticias</h1>
          <p>Comprueba la conexión e inténtalo nuevamente.</p>
          <button class="button" type="button" @click="refresh()">Reintentar</button>
        </template>
        <template v-else>
          <h1>Aún no hay noticias publicadas</h1>
          <p>Los reporteros podrán publicar la primera desde su panel.</p>
          <NuxtLink to="/reporteros" class="button">Ir al panel</NuxtLink>
        </template>
      </section>
    </main>
  </div>
</template>
