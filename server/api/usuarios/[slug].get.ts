export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug")
  if (!slug || !/^[a-f0-9]{24}$/.test(slug)) {
    throw createError({ statusCode: 404, statusMessage: "Perfil no encontrado." })
  }

  const db = await getDb()
  const user = await db.collection("users").findOne({
    _id: toObjectId(slug),
    active: { $ne: false }
  })
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "Perfil no encontrado." })
  }

  const autorId = user._id.toString()
  const noticias = await db.collection("news")
    .find({
      estado: "publicada",
      aprobada: true,
      $or: [{ autorId }, { autorSlug: autorId }]
    })
    .sort({ publicadaEn: -1 })
    .limit(60)
    .toArray()

  setResponseHeader(event, "Cache-Control", "public, max-age=0, must-revalidate")
  return {
    usuario: serializeUsuarioPublico(user),
    noticias: noticias.map(serializeNews)
  }
})
