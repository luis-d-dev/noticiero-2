import { ObjectId, type WithId, type Document } from "mongodb"

export function toObjectId(id: string | undefined | null) {
  if (!id || !ObjectId.isValid(id)) {
    throw createError({ statusCode: 404, statusMessage: "Perfil no encontrado." })
  }
  return new ObjectId(id)
}

export function rolLegible(role: string | undefined) {
  return role === "editor" ? "Editor" : "Reportero"
}

export function serializeUsuarioPublico(document: WithId<Document>) {
  const id = document._id.toString()
  return {
    id,
    nombre: document.nombre,
    slug: id,
    role: document.role === "editor" ? "editor" : "reporter",
    bio: typeof document.bio === "string" && document.bio.trim() ? document.bio : "",
    fotoUrl: typeof document.fotoUrl === "string" && document.fotoUrl.trim() ? document.fotoUrl : ""
  }
}
