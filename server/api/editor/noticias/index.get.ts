export default defineEventHandler(async (event) => {
  requireEditor(event)

  const db = await getDb()
  const documents = await db.collection("news")
    .find({ estado: "publicada" })
    .sort({ publicadaEn: -1 })
    .limit(100)
    .toArray()

  setResponseHeader(event, "Cache-Control", "private, no-store")
  return documents.map(serializeNews)
})
