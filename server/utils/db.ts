import { MongoClient, ServerApiVersion, type Db } from "mongodb"

let cliente: MongoClient | undefined
let conexion: Promise<MongoClient> | undefined

export async function getDb(): Promise<Db> {
  const config = useRuntimeConfig()
  if (!config.mongodbUri) {
    throw createError({ statusCode: 500, statusMessage: "Falta configurar NUXT_MONGODB_URI." })
  }

  if (!cliente) {
    cliente = new MongoClient(config.mongodbUri, {
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
