<script setup lang="ts">
import type { Reporter } from "~/types/noticia"

defineProps<{ transparente?: boolean }>()

const { reporter, comprobado, comprobar, salir } = useReporter()
const mostrarMenu = ref(false)

onMounted(() => {
  if (!comprobado.value) comprobar()
})

function alternarMenu() {
  mostrarMenu.value = !mostrarMenu.value
}
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
      </nav>

      <div v-if="comprobado" class="session-area">
        <NuxtLink
          v-if="!reporter"
          to="/ingresar"
          class="session-button"
          :class="{ 'session-button--dark': transparente }"
        >
          Ingresar
        </NuxtLink>

        <div v-else class="session-menu">
          <button
            class="session-toggle"
            :class="{ 'session-toggle--dark': transparente }"
            type="button"
            :aria-expanded="mostrarMenu"
            @click="alternarMenu"
          >
            <span class="session-toggle__avatar">{{ reporter.nombre.charAt(0).toUpperCase() }}</span>
            <span class="session-toggle__name">{{ reporter.nombre.split(" ")[0] }}</span>
          </button>
          <div v-if="mostrarMenu" class="session-dropdown">
            <div class="session-dropdown__head">
              <strong>{{ reporter.nombre }}</strong>
              <span>{{ reporter.role === 'editor' ? 'Editor' : 'Reportero' }}</span>
            </div>
            <NuxtLink v-if="reporter.role === 'editor'" to="/editorial" @click="mostrarMenu = false">
              Editorial
            </NuxtLink>
            <NuxtLink to="/panel" @click="mostrarMenu = false">Ir al panel</NuxtLink>
            <NuxtLink v-if="reporter.slug" :to="`/usuarios/${reporter.slug}`" @click="mostrarMenu = false">
              Mi perfil público
            </NuxtLink>
            <NuxtLink to="/mi-perfil" @click="mostrarMenu = false">Editar mi perfil</NuxtLink>
            <button type="button" @click="salir">Cerrar sesión</button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
