# Noticiero Maesvida · Nuxt

Migración del sitio original a Nuxt 4, lista para desplegarse en Vercel. Incluye carrusel automático, páginas individuales, acceso privado para reporteros, publicación de noticias, MongoDB y portadas en Vercel Blob.

## Requisitos

- Node.js 22 o una versión par más reciente.
- Un clúster de MongoDB Atlas.
- Un proyecto de Vercel con un almacén **público** de Vercel Blob.

## Desarrollo local

```bash
cp .env.example .env
npm install
npm run dev
```

Completa `.env` antes de iniciar. `NUXT_SESSION_SECRET` debe ser un valor aleatorio de al menos 32 caracteres; por ejemplo, puedes generarlo con `openssl rand -base64 48`.

## Migrar las noticias originales

Las tres portadas originales ya están en `public/images/noticias`. Para guardar sus datos en MongoDB ejecuta una sola vez:

```bash
npm run seed
```

El comando es idempotente: puede repetirse sin duplicar noticias.

## Crear reporteros

No existe registro público. El administrador crea o actualiza cada reportero desde una terminal conectada a MongoDB:

```bash
npm run reporter:create -- "Nombre Apellido" "reportero@ejemplo.com" "una-contraseña-segura"
```

La contraseña debe tener al menos 6 caracteres.

Después, el reportero ingresa en `/reporteros`. Las contraseñas se almacenan con `scrypt`; la sesión se guarda en una cookie `HttpOnly`, `SameSite=Strict` y firmada.

## Crear editores

El administrador crea o actualiza editores con:

```bash
npm run editor:create -- "Nombre Apellido" "editor@ejemplo.com" "una-contraseña-segura"
```

Los editores ingresan en `/reporteros`, donde también pueden crear noticias, modificar su título, resumen y contenido, aprobarlas, retirar su aprobación o eliminarlas. Toda noticia nueva, incluso si la crea un editor, comienza sin aprobar y no es visible públicamente hasta que un editor la aprueba.

## Desplegar en Vercel

1. Sube la carpeta `noticiero_2` a un repositorio o selecciónala como **Root Directory** del proyecto en Vercel.
2. En MongoDB Atlas, crea el clúster, un usuario de base de datos y permite conexiones desde Vercel. Copia la cadena de conexión.
3. En Vercel, crea un almacén Blob con acceso **Public** y conéctalo al proyecto mediante OIDC. Vercel añadirá los datos del almacén y suministrará credenciales OIDC de corta duración durante la ejecución.
4. Añade estas variables en Production, Preview y Development:
   - `NUXT_MONGODB_URI`
   - `NUXT_MONGODB_DB`
   - `NUXT_SESSION_SECRET`
   - `BLOB_STORE_ID`
   - `BLOB_WEBHOOK_PUBLIC_KEY`
5. Despliega. Ejecuta localmente `npm run seed` y `npm run reporter:create -- ...` usando la misma URI de producción para cargar el contenido inicial y crear usuarios.

Cada variable de Vercel debe crearse como una entrada independiente. En particular, el valor de `NUXT_MONGODB_URI` debe contener solamente la URI, sin comillas, por ejemplo `mongodb+srv://.../?retryWrites=true&w=majority`. Si se importan variables desde un archivo `.env`, debe haber un salto de línea entre `NUXT_MONGODB_URI` y la siguiente variable. Después de corregir una variable, es necesario volver a desplegar para que la función use el valor nuevo.

Las imágenes nuevas se envían directamente del navegador a Vercel Blob usando explícitamente `access: "public"` y URLs de subida presignadas mediante OIDC; no requieren un `BLOB_READ_WRITE_TOKEN` permanente. Si una portada supera los 1800 px en cualquiera de sus lados o pesa más de 10 MB, el navegador reduce sus dimensiones y la convierte a WebP antes de subirla. La API mantiene un límite estricto de 10 MB y solo admite JPG, PNG o WebP. Solo entrega permisos de subida de corta duración a reporteros autenticados y, al crear una noticia, acepta únicamente URLs HTTPS del dominio público `*.public.blob.vercel-storage.com`. Las portadas se muestran directamente desde su URL pública.

## Colecciones de MongoDB

- `news`: título, slug, resumen, contenido opcional, portada, categoría, autor, aprobación, estado y fechas. Sin contenido, la noticia funciona únicamente como portada y no tiene página de detalle. Solo los documentos con `aprobada: true` son públicos.
- `users`: nombre, correo único, hash de contraseña, rol (`reporter` o `editor`), estado y fechas.
