interface PerfilBody {
  bio?: unknown
  fotoUrl?: unknown
}

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = requireAuthenticatedUser(event)
  const body = await readBody<PerfilBody>(event)

  const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 500) : undefined

  let fotoUrl: string | undefined
  if (body.fotoUrl != null && body.fotoUrl !== "") {
    const valor = String(body.fotoUrl).trim()
    if (valor.length > 2_000) {
      throw createError({ statusCode: 400, statusMessage: "La URL de la foto no es válida." })
    }
    let image: URL
    try {
      image = new URL(valor)
    } catch {
      throw createError({ statusCode: 400, statusMessage: "La URL de la foto no es válida." })
    }
    if (image.protocol !== "https:" || !image.hostname.endsWith(".public.blob.vercel-storage.com")) {
      throw createError({
        statusCode: 400,
        statusMessage: "La foto debe pertenecer al almacén público de Vercel Blob."
      })
    }
    fotoUrl = valor
  } else {
    fotoUrl = ""
  }

  const db = await getDb()
  await db.collection("users").updateOne(
    { _id: toObjectId(user.id) },
    {
      $set: {
        ...(bio !== undefined ? { bio } : {}),
        ...(fotoUrl !== undefined ? { fotoUrl } : {}),
        actualizadaEn: new Date()
      }
    }
  )

  const document = await db.collection("users").findOne({ _id: toObjectId(user.id) })
  return { usuario: serializeUsuarioPublico(document!) }
})
