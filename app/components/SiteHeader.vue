<script setup lang="ts">
defineProps<{ transparente?: boolean }>()
</script>

<template>
  <header class="site-header" :class="{ 'site-header--solid': !transparente }">
    <div class="orange-strip" />
    <div class="nav-bar">
      <NuxtLink to="/" class="brand" aria-label="Noticiero Maesvida, inicio">
        <img src="/images/logo.png" alt="Noticiero Maesvida">
      </NuxtLink>
      <nav aria-label="Navegación principal">
        <NuxtLink to="/">Inicio</NuxtLink>
        <a href="/#noticias">Noticias</a>
        <NuxtLink to="/reporteros">Reporteros</NuxtLink>
      </nav>
    </div>
  </header>
</template>
