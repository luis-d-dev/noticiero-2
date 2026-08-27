import { issueSignedToken } from "@vercel/blob"
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client"
import { toWebRequest } from "h3"

const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"]
const tamanoMaximo = 10 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const request = toWebRequest(event)
  const body = await request.clone().json() as HandleUploadPresignedBody

  try {
    return await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname, clientPayload) => {
        assertSameOrigin(event)
        const reporter = requireReporter(event)
        if (!pathname.startsWith("noticias/")) {
          throw new Error("Ruta de archivo no permitida.")
        }

        return {
          token: await issueSignedToken({
            pathname,
            operations: ["put"],
            allowedContentTypes: tiposPermitidos,
            maximumSizeInBytes: tamanoMaximo
          }),
          urlOptions: {
            allowedContentTypes: tiposPermitidos,
            maximumSizeInBytes: tamanoMaximo,
            addRandomSuffix: true,
            tokenPayload: clientPayload || JSON.stringify({ reporterId: reporter.id })
          }
        }
      }
    })
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : "No se pudo subir la imagen."
    })
  }
})
