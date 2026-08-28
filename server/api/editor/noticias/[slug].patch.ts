interface EditorialBody {
  titulo?: unknown
  resumen?: unknown
  contenido?: unknown
  aprobada?: unknown
}

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const editor = requireEditor(event)
  const slug = getRouterParam(event, "slug")
  if (!slug || !/^[a-z0-9-]{1,100}$/.test(slug)) {
    throw createError({ statusCode: 404, statusMessage: "Noticia no encontrada." })
  }

  const body = await readBody<EditorialBody>(event)
  const titulo = requiredText(body.titulo, "El título", 5, 140)
  const resumen = requiredText(body.resumen, "El resumen", 10, 300)
  if (typeof body.aprobada !== "boolean") {
    throw createError({ statusCode: 400, statusMessage: "El estado de aprobación no es válido." })
  }

  const contenidoVacio = body.contenido == null || (typeof body.contenido === "string" && !body.contenido.trim())
  const contenido = contenidoVacio ? undefined : requiredText(body.contenido, "El contenido", 30, 20_000)
  const now = new Date()
  const db = await getDb()
  const cambios = {
    titulo,
    resumen,
    aprobada: body.aprobada,
    actualizadaEn: now,
    editadaPorId: editor.id,
    editadaPorNombre: editor.nombre,
    ...(contenido ? { contenido } : {}),
    ...(body.aprobada ? { aprobadaEn: now, aprobadaPorId: editor.id } : {})
  }
  const result = await db.collection("news").findOneAndUpdate(
    { slug, estado: "publicada" },
    {
      $set: cambios,
      ...(!contenido || !body.aprobada
        ? { $unset: {
            ...(!contenido ? { contenido: "" } : {}),
            ...(!body.aprobada ? { aprobadaEn: "", aprobadaPorId: "" } : {})
          } }
        : {})
    },
    { returnDocument: "after" }
  )

  if (!result) throw createError({ statusCode: 404, statusMessage: "Noticia no encontrada." })
  setResponseHeader(event, "Cache-Control", "private, no-store")
  return serializeNews(result)
})
