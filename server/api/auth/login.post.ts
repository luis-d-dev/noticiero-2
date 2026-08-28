interface LoginBody {
  email?: unknown
  password?: unknown
}

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const body = await readBody<LoginBody>(event)
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body.password === "string" ? body.password : ""

  if (!email || !password || password.length > 200) {
    throw createError({ statusCode: 400, statusMessage: "Correo y contraseña son obligatorios." })
  }

  const db = await getDb()
  const user = await db.collection("users").findOne({
    email,
    role: { $in: ["reporter", "editor"] },
    active: { $ne: false }
  })
console.log(`Encontrado ${user.nombre}`);
  const valid = user && typeof user.passwordHash === "string"
    ? await verifyPassword(password, user.passwordHash)
    : false

  if (!user || !valid) {
    throw createError({ statusCode: 401, statusMessage: "Correo o contraseña incorrectos." })
  }

  const sessionUser = {
    id: user._id.toString(),
    nombre: String(user.nombre),
    email: String(user.email),
    role: user.role as "reporter" | "editor"
  }
  createSession(event, sessionUser)
  return { user: sessionUser }
})
