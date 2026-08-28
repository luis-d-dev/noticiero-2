export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  requireEditor(event)

  const slug = getRouterParam(event, "slug")
  if (!slug || !/^[a-z0-9-]{1,100}$/.test(slug)) {
    throw createError({ statusCode: 404, statusMessage: "Noticia no encontrada." })
  }

  const db = await getDb()
  const result = await db.collection("news").deleteOne({ slug, estado: "publicada" })
  if (!result.deletedCount) {
    throw createError({ statusCode: 404, statusMessage: "Noticia no encontrada." })
  }

  setResponseStatus(event, 204)
  return null
})
