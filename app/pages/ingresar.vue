<script setup lang="ts">
const { reporter, comprobado, comprobar } = useReporter()
const route = useRoute()
const credenciales = reactive({ email: "", password: "" })
const enviando = ref(false)
const errorMensaje = ref("")

const rutaDeRedireccion = computed(() => {
  const redirigir = route.query.redirigir
  return typeof redirigir === "string" && redirigir.startsWith("/") ? redirigir : "/panel"
})

onMounted(async () => {
  if (!comprobado.value) await comprobar()
  if (reporter.value) await navigateTo(rutaDeRedireccion.value)
})

function mensajeDeError(error: unknown) {
  const posible = error as { data?: { statusMessage?: string; message?: string }; message?: string }
  return posible.data?.statusMessage || posible.data?.message || posible.message || "Ocurrió un error inesperado."
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
    await navigateTo(rutaDeRedireccion.value)
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
      <section class="auth-card">
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
    </main>
  </div>
</template>