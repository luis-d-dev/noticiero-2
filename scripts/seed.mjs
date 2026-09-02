import { loadEnvFile } from "node:process"
import { MongoClient } from "mongodb"

try { loadEnvFile() } catch {}
if (!process.env.NUXT_MONGODB_URI) throw new Error("Falta NUXT_MONGODB_URI en .env.")

const noticias = [
  {
    titulo: "El cable inesperado",
    slug: "el-cable-inesperado",
    resumen: "Un arborista despistado se encontraba podando una enorme planta de veranera sin saber lo que se escondía entre las ramas…",
    contenido: "Un arborista despistado se encontraba podando una enorme planta de veranera sin saber lo que se escondía entre las ramas…",
    enlaces: [{ nombre: "Cómo podar plantas trepadoras", url: "https://example.com/podar" }],
    imagenUrl: "/images/noticias/el-cable-inesperado.jpg"
  },
  {
    titulo: "Jhoan el mejor arquero",
    slug: "jhoan-el-mejor-arquero",
    resumen: "La FIFA nombró a Jhoan como el Vozinha de Maesvida.",
    contenido: "La FIFA nombró a Jhoan como el Vozinha de Maesvida.",
    imagenUrl: "/images/noticias/jhoan-el-mejor-arquero.jpg"
  },
  {
    titulo: "Se acerca el lanzamiento",
    slug: "se-acerca-el-lanzamiento",
    resumen: "Joaquín está trabajando en un videojuego de plataforma donde pronto lo veremos.",
    contenido: "Joaquín está trabajando en un videojuego de plataforma donde pronto lo veremos.",
    imagenUrl: "/images/noticias/se-acerca-el-lanzamiento.jpg"
  }
]

const client = new MongoClient(process.env.NUXT_MONGODB_URI)
try {
  const db = client.db(process.env.NUXT_MONGODB_DB || "noticiero_maesvida")
  const news = db.collection("news")
  await news.createIndex({ slug: 1 }, { unique: true })
  await news.createIndex({ estado: 1, aprobada: 1, publicadaEn: -1 })
  const now = new Date()
  for (const noticia of noticias) {
    await news.updateOne(
      { slug: noticia.slug },
      {
        $set: { ...noticia, categoria: "Comunidad", autorNombre: "Noticiero Maesvida", estado: "publicada", aprobada: true, actualizadaEn: now },
        $setOnInsert: { creadaEn: now, publicadaEn: now }
      },
      { upsert: true }
    )
  }
  console.log(`${noticias.length} noticias migradas a MongoDB.`)
} finally {
  await client.close()
}
