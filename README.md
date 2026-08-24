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

Después, el reportero ingresa en `/reporteros`. Las contraseñas se almacenan con `scrypt`; la sesión se guarda en una cookie `HttpOnly`, `SameSite=Strict` y firmada.

## Desplegar en Vercel

1. Sube la carpeta `noticiero_2` a un repositorio o selecciónala como **Root Directory** del proyecto en Vercel.
2. En MongoDB Atlas, crea el clúster, un usuario de base de datos y permite conexiones desde Vercel. Copia la cadena de conexión.
3. En Vercel, crea un almacén Blob con acceso **Public** y conéctalo al proyecto. Vercel añadirá `BLOB_READ_WRITE_TOKEN`.
4. Añade estas variables en Production, Preview y Development:
   - `NUXT_MONGODB_URI`
   - `NUXT_MONGODB_DB`
   - `NUXT_SESSION_SECRET`
   - `BLOB_READ_WRITE_TOKEN` (la integración Blob normalmente la crea)
5. Despliega. Ejecuta localmente `npm run seed` y `npm run reporter:create -- ...` usando la misma URI de producción para cargar el contenido inicial y crear usuarios.

Las imágenes nuevas se envían directamente del navegador a Vercel Blob y se limitan a JPG, PNG o WebP de hasta 10 MB. La API solo entrega tokens de subida a reporteros autenticados.

## Colecciones de MongoDB

- `news`: título, slug, resumen, contenido, portada, categoría, autor, estado y fechas.
- `users`: nombre, correo único, hash de contraseña, rol, estado y fechas.
