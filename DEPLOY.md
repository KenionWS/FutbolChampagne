# Guía de Deploy - Fútbol Champagne

Stack: **Vercel** (frontend) + **Render** (backend) + **Neon** (PostgreSQL).
Todo gratuito.

---

## 1️⃣ Base de datos en Neon

1. Crear cuenta en https://neon.tech
2. **Create Project** → Region: AWS US East (más cercano a Render)
3. Copiar el **Connection string** (formato: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)
4. Guardalo, lo vas a usar como `DATABASE_URL` en Render

> Las migraciones se corren automáticamente en cada deploy (`npm run db:migrate` está en el `buildCommand` de Render).

---

## 2️⃣ Backend en Render

1. Subir el repo a GitHub (público o privado)
2. Crear cuenta en https://render.com
3. **New +** → **Web Service** → conectar tu repo
4. Configurar:
   - **Name**: `el-bidon-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run db:migrate`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. **Environment Variables**:
   ```
   NODE_ENV=production
   DATABASE_URL=<tu connection string de Neon>
   JWT_SECRET=<cualquier string largo random>
   GOOGLE_CLIENT_ID=<tu client id de Google>
   FRONTEND_URL=https://tu-app.vercel.app
   ```
6. **Create Web Service** → esperar el primer deploy
7. Copiar la URL final (ej: `https://el-bidon-backend.onrender.com`)

> ⚠️ El free tier "duerme" tras 15 min de inactividad. El primer request post-sueño tarda ~30s.

---

## 3️⃣ Frontend en Vercel

1. Crear cuenta en https://vercel.com
2. **Add New** → **Project** → importar el mismo repo
3. Configurar:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Create React App (auto-detectado)
4. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://el-bidon-backend.onrender.com
   REACT_APP_GOOGLE_CLIENT_ID=<tu client id de Google>
   ```
5. **Deploy**
6. Copiar la URL (ej: `https://el-bidon.vercel.app`)

---

## 4️⃣ Atar los cabos

### Actualizar `FRONTEND_URL` en Render
Una vez tengas la URL de Vercel, volvé a Render y actualizá la env var `FRONTEND_URL` con esa URL. Disparar redeploy.

### Actualizar Google OAuth
En https://console.cloud.google.com/apis/credentials → tu OAuth Client:
- **Authorized JavaScript origins**: agregar `https://tu-app.vercel.app`
- **Authorized redirect URIs**: agregar `https://tu-app.vercel.app`

---

## 🐛 Troubleshooting

**Frontend no se conecta al backend**
- Revisar que `REACT_APP_API_URL` esté bien seteado en Vercel
- Verificar `FRONTEND_URL` en Render incluye la URL de Vercel
- En DevTools (Network tab), confirmar que las llamadas van al dominio de Render

**Error de SSL al conectar a Neon**
- Verificar que `NODE_ENV=production` en Render
- El connection string de Neon debe terminar en `?sslmode=require`

**El primer request tarda 30 segundos**
- Es el free tier de Render despertando. Normal.
- Solución: pasar a plan paid ($7/mes) o usar un servicio de "ping" (UptimeRobot pinging cada 14min)

**Migraciones fallan en deploy**
- Render muestra los logs en la pestaña "Logs"
- Las migraciones son idempotentes — los errores tipo "already exists" se ignoran
- Si falla algo más serio, correr manualmente: en Render → "Shell" → `npm run db:migrate`

---

## 🔄 Reactivar subida de fotos (futuro)

Cuando quieras volver a habilitar el upload de fotos:

1. Crear cuenta en https://cloudinary.com (free 25GB)
2. Reemplazar `multer.diskStorage` por `multer-storage-cloudinary` en `backend/src/routes/auth.js`
3. Descomentar bloques marcados con `=== SUBIDA DE FOTOS ===` (backend) y cambiar `PHOTO_UPLOAD_ENABLED = true` en `frontend/src/components/AvatarSelector.jsx`
4. Agregar env vars de Cloudinary en Render
