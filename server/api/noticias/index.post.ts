interface NewsBody {
  titulo?: unknown
  resumen?: unknown
  contenido?: unknown
  categoria?: unknown
  imagenUrl?: unknown
}

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const reporter = requireReporter(event)
  const body = await readBody<NewsBody>(event)
  const titulo = requiredText(body.titulo, "El título", 5, 140)
  const resumen = requiredText(body.resumen, "El resumen", 10, 300)
  const contenido = requiredText(body.contenido, "El contenido", 30, 20_000)
  const categoria = requiredText(body.categoria, "La categoría", 2, 40)
  const imagenUrl = requiredText(body.imagenUrl, "La imagen", 8, 2_000)

  let image: URL
  try {
    image = new URL(imagenUrl)
  } catch {
    throw createError({ statusCode: 400, statusMessage: "La URL de la imagen no es válida." })
  }
  if (image.protocol !== "https:") {
    throw createError({ statusCode: 400, statusMessage: "La imagen debe usar una URL HTTPS." })
  }

  const db = await getDb()
  const collection = db.collection("news")
  await collection.createIndex({ slug: 1 }, { unique: true })
  await collection.createIndex({ estado: 1, publicadaEn: -1 })

  const baseSlug = slugify(titulo) || "noticia"
  let slug = baseSlug
  let suffix = 2
  while (await collection.findOne({ slug }, { projection: { _id: 1 } })) {
    slug = `${baseSlug}-${suffix++}`
  }

  const now = new Date()
  const document = {
    titulo,
    slug,
    resumen,
    contenido,
    imagenUrl,
    categoria,
    autorId: reporter.id,
    autorNombre: reporter.nombre,
    estado: "publicada",
    publicadaEn: now,
    creadaEn: now,
    actualizadaEn: now
  }
  const result = await collection.insertOne(document)
  setResponseStatus(event, 201)
  return serializeNews({ ...document, _id: result.insertedId })
})
