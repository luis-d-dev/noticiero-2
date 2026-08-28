export default defineNuxtConfig({
  compatibilityDate: "2026-08-13",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    mongodbUri: "",
    mongodbDb: "noticiero_maesvida",
    sessionSecret: ""
  },
  app: {
    head: {
      htmlAttrs: { lang: "es" },
      title: "Noticiero Maesvida",
      meta: [
        { name: "description", content: "Las noticias de la comunidad Maesvida." },
        { name: "viewport", content: "width=device-width, initial-scale=1" }
      ]
    }
  },
  nitro: {
    preset: "vercel"
  },
  routeRules: {
    "/reporteros": { redirect: "/panel" }
  }
})
