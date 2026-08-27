import type { WithId, Document } from "mongodb"

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90)
}

export function serializeNews(document: WithId<Document>) {
  return {
    _id: document._id.toString(),
    titulo: document.titulo,
    slug: document.slug,
    resumen: document.resumen,
    contenido: typeof document.contenido === "string" && document.contenido.trim()
      ? document.contenido
      : undefined,
    imagenUrl: document.imagenUrl,
    categoria: document.categoria,
    autorNombre: document.autorNombre,
    publicadaEn: document.publicadaEn instanceof Date ? document.publicadaEn.toISOString() : document.publicadaEn
  }
}

export function requiredText(value: unknown, field: string, min: number, max: number) {
  if (typeof value !== "string") {
    throw createError({ statusCode: 400, statusMessage: `${field} es obligatorio.` })
  }
  const clean = value.trim()
  if (clean.length < min || clean.length > max) {
    throw createError({ statusCode: 400, statusMessage: `${field} debe tener entre ${min} y ${max} caracteres.` })
  }
  return clean
}
