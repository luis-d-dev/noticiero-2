import { randomBytes, scrypt as scryptCallback } from "node:crypto"
import { loadEnvFile } from "node:process"
import { promisify } from "node:util"
import { MongoClient } from "mongodb"

try { loadEnvFile() } catch {}

const [, , nombreArg, emailArg, passwordArg] = process.argv
const nombre = nombreArg?.trim()
const email = emailArg?.trim().toLowerCase()
const password = passwordArg

if (!process.env.NUXT_MONGODB_URI) {
  throw new Error("Falta NUXT_MONGODB_URI en .env.")
}
if (!nombre || !email || !password) {
  throw new Error('Uso: npm run reporter:create -- "Nombre" "correo@ejemplo.com" "contraseña-segura"')
}
if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 10) {
  throw new Error("Usa un correo válido y una contraseña de al menos 10 caracteres.")
}

const salt = randomBytes(16).toString("hex")
const derived = await promisify(scryptCallback)(password, salt, 64)
const passwordHash = `scrypt:${salt}:${derived.toString("hex")}`
const client = new MongoClient(process.env.NUXT_MONGODB_URI)

try {
  const db = client.db(process.env.NUXT_MONGODB_DB || "noticiero_maesvida")
  const users = db.collection("users")
  await users.createIndex({ email: 1 }, { unique: true })
  const now = new Date()
  await users.updateOne(
    { email },
    { $set: { nombre, email, passwordHash, role: "reporter", active: true, actualizadaEn: now }, $setOnInsert: { creadaEn: now } },
    { upsert: true }
  )
  console.log(`Reportero creado o actualizado: ${email}`)
} finally {
  await client.close()
}
