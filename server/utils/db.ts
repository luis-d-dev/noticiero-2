import { MongoClient, ServerApiVersion, type Db } from "mongodb"

let cliente: MongoClient | undefined
let conexion: Promise<MongoClient> | undefined

function obtenerMongoUri(valor: unknown): string {
  if (typeof valor !== "string" || !valor.trim()) {
    throw createError({ statusCode: 500, statusMessage: "Falta configurar NUXT_MONGODB_URI." })
  }

  const uri = valor.trim()
  const pareceContenerOtraVariable = /[\r\n]|\s+[A-Z][A-Z0-9_]*=/.test(uri)

  if (!/^mongodb(?:\+srv)?:\/\//.test(uri) || pareceContenerOtraVariable || uri.includes('"')) {
    throw createError({
      statusCode: 500,
      statusMessage: "NUXT_MONGODB_URI no es válida. Configura únicamente la URI de MongoDB, sin comillas ni otras variables."
    })
  }

  return uri
}

export async function getDb(): Promise<Db> {
  const config = useRuntimeConfig()
  const mongodbUri = obtenerMongoUri(config.mongodbUri)

  if (!cliente) {
    cliente = new MongoClient(mongodbUri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 30_000,
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
    })
    conexion = cliente.connect()
  }

  const clienteConectado = await conexion
  return clienteConectado.db(config.mongodbDb)
}
