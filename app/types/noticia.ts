export interface Noticia {
  _id: string
  titulo: string
  slug: string
  resumen: string
  contenido?: string
  aprobada: boolean
  imagenUrl: string
  categoria: string
  autorNombre: string
  publicadaEn: string
}

export interface Reporter {
  id: string
  nombre: string
  email: string
  role: "reporter" | "editor"
}
