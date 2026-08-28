export default defineEventHandler(async (event) => {
  const user = requireAuthenticatedUser(event)
  const db = await getDb()
  const document = await db.collection("users").findOne({ _id: toObjectId(user.id) })

  setResponseHeader(event, "Cache-Control", "private, no-store")
  if (!document) {
    throw createError({ statusCode: 404, statusMessage: "Perfil no encontrado." })
  }
  return { usuario: serializeUsuarioPublico(document) }
})
