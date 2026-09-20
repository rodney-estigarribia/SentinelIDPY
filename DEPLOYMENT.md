# 🚀 Guía de Despliegue — SentinelIDPY (Vercel + Neon Postgres)

Esta guía documenta paso a paso cómo probar localmente la plataforma y cómo desplegarla en **Vercel** usando la rama `develop` (entorno de pruebas/preview gratuito) sin tocar producción.

---

## 💻 1. Pruebas en Entorno Local (Tu Computadora)

### ¿Tienes que configurar alguna variable?
**No, no necesitas configurar nada.** El proyecto ya viene con el archivo `dashboard/.env.local` configurado con valores listos para usar:

```env
OTP_SECRET="JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP"
SESSION_SECRET="sentinel-idpy-secure-session-secret-key-2026-very-long"
WF_REPORT_TOKEN="a1b2c3d4e5f67890123456789abcdef0"
```

* **Base de datos local:** Si no configuras `DATABASE_URL`, el dashboard activa automáticamente su sistema de datos en memoria (con clientes reales de `clientes.json`, infraestructura de Hosting Paraguay / nic.py, métricas y plantillas pre-cargadas).
* **Para vincular tu teléfono en local:**
  1. Abre **Google Authenticator** (o Authy / 1Password / Apple Passwords).
  2. Toca en **Añadir cuenta (+)** → **Ingresar clave de configuración**.
  3. Ingresa:
     - **Nombre de cuenta:** `SentinelIDPY (Local)`
     - **Tu clave:** `JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP`
     - **Tipo:** Basada en tiempo (TOTP)
  4. Ingresa el código de 6 dígitos en `http://localhost:3000` y ¡acceso concedido!

---

## ☁️ 2. Pasos para el Despliegue en Vercel (Rama `develop`)

Sigue estos 5 pasos cuando termines tus pruebas locales y quieras tener el panel accesible en la nube:

### Paso 1: Subir tus cambios locales a GitHub (Rama `develop`)
Ejecuta en tu terminal:
```bash
git push -u origin develop
```

### Paso 2: Crear el Proyecto en Vercel
1. Ingresa a [vercel.com/new](https://vercel.com/new) con tu cuenta.
2. Selecciona tu repositorio: **`SentinelIDPY`**.
3. ⚠️ **Configuración Crítica — Directorio Raíz (Root Directory):**
   - En la sección **Root Directory**, haz clic en **Edit**.
   - Selecciona la carpeta **`dashboard`** (no la raíz del repositorio).
4. Vercel detectará automáticamente:
   - **Framework Preset:** `Next.js`
   - **Build Command:** `next build`
   - **Output Directory:** `.next`

### Paso 3: Configurar Variables de Entorno en Vercel
En la misma pantalla de importación de Vercel (o posteriormente en *Settings → Environment Variables*), agrega:

| Variable | Valor Recomendado / Descripción |
| :--- | :--- |
| `OTP_SECRET` | Tu clave Base32 para Google Authenticator (puedes usar la misma `JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP` o una nueva privada). |
| `SESSION_SECRET` | Una cadena secreta larga y aleatoria para firmar las cookies de sesión (ej. `sentinel-idpy-prod-session-key-2026-super-secure-long-string`). |
| `WF_REPORT_TOKEN` | Token para recibir webhooks de Wordfence (ej. `a1b2c3d4e5f67890123456789abcdef0`). |

> **Nota de seguridad:** Al estar en Vercel (`production`), la pantalla de `/login` **no revelará la clave secreta** en el navegador, asegurando que nadie ajeno a ti pueda registrar su autenticador.

### Paso 4: Base de Datos Gratuita con Neon Postgres (1 Clic)
1. Una vez desplegado el proyecto en Vercel, ve a la pestaña **Storage** del proyecto.
2. Haz clic en **Create Database** y selecciona **Neon Postgres** (plan Serverless gratuito con 0.5 GB).
3. Haz clic en **Create & Link** seleccionando tu proyecto `dashboard`.
4. Vercel inyectará automáticamente las variables `POSTGRES_URL` y `DATABASE_URL` a tus entornos (Preview y Production) sin que tengas que copiarlas manualmente.

### Paso 5: Manejo de Ramas (Preview vs Producción)
* Mientras trabajes en la rama **`develop`**, Vercel generará enlaces de **Preview Deployment** (ej. `https://sentinel-idpy-git-develop-tu-usuario.vercel.app`).
* Esto te permite probar todo en la nube de forma segura sin afectar `main` ni lanzar la versión definitiva a producción hasta que tú lo decidas.

---

## 🔌 3. Conexión con Sitios WordPress (Clientes)

El archivo comprimido del conector actualizado (**v4.2**) se encuentra en la raíz de este repositorio:
```
wordpress-plugin.zip
```

### Pasos en cada cliente WordPress:
1. En el panel de WordPress del cliente (`wp-admin`), ve a **Plugins → Añadir nuevo → Subir plugin**.
2. Selecciona `wordpress-plugin.zip` y actívalo.
3. Ve a **Ajustes → Sentinel Connector**.
4. Define una clave de API secreta (ej. `wp-secret-token-cliente-1`).
5. En el panel de **SentinelIDPY** (`/sites` o al registrar un nuevo sitio), ingresa:
   - URL del sitio (ej. `https://cliente.com.py`)
   - API Key configurada.
6. ¡Listo! El panel comenzará a monitorear actualizaciones, Wordfence, backups UpdraftPlus y analítica ligera de 6 meses.
