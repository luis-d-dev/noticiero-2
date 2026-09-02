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
    enlaces: Array.isArray(document.enlaces) ? document.enlaces : undefined,
    aprobada: document.aprobada === true,
    imagenUrl: document.imagenUrl,
    categoria: document.categoria,
    autorNombre: document.autorNombre,
    autorSlug: typeof document.autorSlug === "string" && document.autorSlug ? document.autorSlug : "",
    publicadaEn: document.publicadaEn instanceof Date ? document.publicadaEn.toISOString() : document.publicadaEn
  }
}

export function validateEnlaces(raw: unknown): Array<{ nombre: string; url: string }> | undefined {
  if (raw == null) return undefined
  if (!Array.isArray(raw)) {
    throw createError({ statusCode: 400, statusMessage: "Los enlaces deben ser una lista." })
  }
  if (raw.length > 10) {
    throw createError({ statusCode: 400, statusMessage: "No se pueden agregar más de 10 enlaces." })
  }
  return raw.map((item, i) => {
    if (typeof item !== "object" || item === null) {
      throw createError({ statusCode: 400, statusMessage: `El enlace ${i + 1} no es válido.` })
    }
    const { nombre, url } = item as Record<string, unknown>
    if (typeof nombre !== "string" || nombre.trim().length < 1 || nombre.trim().length > 200) {
      throw createError({ statusCode: 400, statusMessage: `El nombre del enlace ${i + 1} debe tener entre 1 y 200 caracteres.` })
    }
    if (typeof url !== "string" || url.trim().length < 5 || url.trim().length > 2000) {
      throw createError({ statusCode: 400, statusMessage: `La URL del enlace ${i + 1} no es válida.` })
    }
    try { new URL(url.trim()) } catch {
      throw createError({ statusCode: 400, statusMessage: `La URL del enlace ${i + 1} no es válida.` })
    }
    return { nombre: nombre.trim(), url: url.trim() }
  })
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
