import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { toWebRequest } from "h3"

export default defineEventHandler(async (event) => {
  const request = toWebRequest(event)
  const body = await request.clone().json() as HandleUploadBody

  try {
    return await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        assertSameOrigin(event)
        const reporter = requireReporter(event)
        if (!pathname.startsWith("noticias/")) {
          throw new Error("Ruta de archivo no permitida.")
        }

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ reporterId: reporter.id })
        }
      },
      onUploadCompleted: async () => {
        // La noticia se crea después de que upload() devuelve la URL al navegador.
      }
    })
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : "No se pudo subir la imagen."
    })
  }
})
