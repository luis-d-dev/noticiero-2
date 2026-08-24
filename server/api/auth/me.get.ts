export default defineEventHandler((event) => {
  const user = requireReporter(event)
  setResponseHeader(event, "Cache-Control", "private, no-store")
  return { user }
})
