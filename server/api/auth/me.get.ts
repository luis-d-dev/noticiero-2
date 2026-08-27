export default defineEventHandler((event) => {
  const user = requireAuthenticatedUser(event)
  setResponseHeader(event, "Cache-Control", "private, no-store")
  return { user }
})
