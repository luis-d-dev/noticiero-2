export interface Enlace {
  nombre: string
  url: string
}

export interface Noticia {
  _id: string
  titulo: string
  slug: string
  resumen: string
  contenido?: string
  enlaces?: Enlace[]
  aprobada: boolean
  imagenUrl: string
  categoria: string
  autorNombre: string
  autorSlug?: string
  publicadaEn: string
}

export interface Reporter {
  id: string
  nombre: string
  email: string
  slug: string
  role: "reporter" | "editor"
}

export interface Usuario {
  id: string
  nombre: string
  slug: string
  role: "reporter" | "editor"
  bio: string
  fotoUrl: string
}
