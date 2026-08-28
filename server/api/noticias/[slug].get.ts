export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug")
  if (!slug || !/^[a-z0-9-]{1,100}$/.test(slug)) {
    throw createError({ statusCode: 404, statusMessage: "Noticia no encontrada." })
  }

  const db = await getDb()
  const document = await db.collection("news").findOne({
    slug,
    estado: "publicada",
    aprobada: true,
    contenido: { $type: "string", $ne: "" }
  })
  if (!document) {
    throw createError({ statusCode: 404, statusMessage: "Noticia no encontrada." })
  }

  setResponseHeader(event, "Cache-Control", "public, max-age=0, must-revalidate")
  return serializeNews(document)
})
