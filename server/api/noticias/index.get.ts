export default defineEventHandler(async (event) => {
  const db = await getDb()
  const documents = await db.collection("news")
    .find({ estado: "publicada" })
    .sort({ publicadaEn: -1 })
    .limit(100)
    .toArray()

  setResponseHeader(event, "Cache-Control", "public, s-maxage=60, stale-while-revalidate=300")
  return documents.map(serializeNews)
})
