export default defineEventHandler((event) => {
  assertSameOrigin(event)
  clearSession(event)
  return { ok: true }
})
