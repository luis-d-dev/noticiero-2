import { createHmac, timingSafeEqual } from "node:crypto"
import type { H3Event } from "h3"

const COOKIE = "maesvida_session"
const DURACION = 60 * 60 * 24 * 7

export interface SessionUser {
  id: string
  nombre: string
  email: string
  slug: string
  role: "reporter" | "editor"
}

interface SessionPayload extends SessionUser {
  exp: number
}

function secret() {
  const value = useRuntimeConfig().sessionSecret
  if (!value || value.length < 32) {
    throw createError({ statusCode: 500, statusMessage: "NUXT_SESSION_SECRET debe tener al menos 32 caracteres." })
  }
  return value
}

function sign(encoded: string) {
  return createHmac("sha256", secret()).update(encoded).digest("base64url")
}

export function createSession(event: H3Event, user: SessionUser) {
  const payload: SessionPayload = { ...user, exp: Math.floor(Date.now() / 1000) + DURACION }
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url")
  setCookie(event, COOKIE, `${encoded}.${sign(encoded)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DURACION
  })
}

export function clearSession(event: H3Event) {
  deleteCookie(event, COOKIE, { path: "/" })
}

export function getSession(event: H3Event): SessionUser | null {
  const token = getCookie(event, COOKIE)
  if (!token) return null

  try {
    const [encoded, signature] = token.split(".")
    if (!encoded || !signature) return null
    const actual = Buffer.from(signature)
    const expected = Buffer.from(sign(encoded))
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null

    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as SessionPayload
    if (payload.exp <= Math.floor(Date.now() / 1000) || !["reporter", "editor"].includes(payload.role)) return null
    return {
      id: payload.id,
      nombre: payload.nombre,
      email: payload.email,
      slug: payload.id,
      role: payload.role
    }
  } catch {
    return null
  }
}

export function requireReporter(event: H3Event) {
  const user = getSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: "Debes iniciar sesión." })
  if (!["reporter", "editor"].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: "Esta acción requiere permisos de publicación." })
  }
  return user
}

export function requireEditor(event: H3Event) {
  const user = getSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: "Debes iniciar sesión." })
  if (user.role !== "editor") throw createError({ statusCode: 403, statusMessage: "Esta acción es exclusiva para editores." })
  return user
}

export function requireAuthenticatedUser(event: H3Event) {
  const user = getSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: "Debes iniciar sesión." })
  return user
}

export function assertSameOrigin(event: H3Event) {
  const origin = getRequestHeader(event, "origin")
  const host = getRequestHeader(event, "x-forwarded-host") || getRequestHeader(event, "host")
  if (!origin || !host) return

  try {
    if (new URL(origin).host !== host) {
      throw createError({ statusCode: 403, statusMessage: "Origen no permitido." })
    }
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 403) throw error
    throw createError({ statusCode: 403, statusMessage: "Origen no permitido." })
  }
}
