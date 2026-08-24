import type { Reporter } from "~/types/noticia"

export function useReporter() {
  const reporter = useState<Reporter | null>("reporter", () => null)
  const comprobado = useState("reporter-comprobado", () => false)

  async function comprobar() {
    try {
      const respuesta = await $fetch<{ user: Reporter }>("/api/auth/me")
      reporter.value = respuesta.user
    } catch {
      reporter.value = null
    } finally {
      comprobado.value = true
    }
  }

  async function salir() {
    await $fetch("/api/auth/logout", { method: "POST" })
    reporter.value = null
    await navigateTo("/")
  }

  return { reporter, comprobado, comprobar, salir }
}
