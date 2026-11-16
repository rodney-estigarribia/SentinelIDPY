# SentinelIDPY — Plataforma Central de Administración & Monitoreo

Plataforma unificada de gestión, mantenimiento, seguridad y monitoreo de infraestructura para la cartera de clientes de **Impulsos Digitales**.

---

## 📁 Estructura del Repositorio

- **`dashboard/`**: Panel de control web desarrollado en **Next.js 15 (App Router)**, Tailwind CSS v4, Lucide Icons y Drizzle ORM. Diseñado para ejecutarse y desplegarse en **Vercel** con persistencia en **Neon Serverless Postgres** (con compatibilidad de migración a Turso).
- **`plugin/`**: Plugin WordPress **SentinelIDPY Connector (v4.2)** con endpoints REST protegidos por token para actualizaciones de core/plugins/temas, instalación remota de paquetes ZIP/WordPress.org, restablecimiento de contraseñas, analítica ligera en base de datos local y personalización white-label.
- **`bot/`**: Bot de Telegram y scripts históricos de monitoreo y generación de reportes en Python.
- **`docs/`**: Documentación técnica, diagramas de arquitectura ([`sentinel_platform_architecture.md`](file:///docs/sentinel_platform_architecture.md)) y roadmaps.

---

## 🚀 Despliegue en Vercel (Panel de Control)

1. **Importar Repositorio en Vercel**:
   - Conectar este repositorio en tu cuenta de Vercel.
   - En **Root Directory**, configurar: `dashboard`.
2. **Base de Datos (Neon Postgres)**:
   - En la pestaña **Storage** de tu proyecto en Vercel, añadir una base de datos **Postgres (Neon)**. Vercel inyectará automáticamente `POSTGRES_URL` y `DATABASE_URL`.
   - *Nota*: Si la base de datos no está configurada, el panel cuenta con un adaptador con los 10 clientes e infraestructura iniciales para funcionar de inmediato en modo demostración/desarrollo.
3. **Variables de Entorno (Opcionales)**:
   - `WF_REPORT_TOKEN`: Token maestro de 32 caracteres para comunicar con los plugins WordPress.
   - `TELEGRAM_BOT_TOKEN`: Token del bot de Telegram para alertas de caídas.
   - `TELEGRAM_CHAT_ID`: ID del chat de Telegram para notificaciones.
   - `VERCEL_API_TOKEN`: Para integración de proyectos y onepages en Vercel.
   - `CRON_SECRET`: Secreto para autenticar las llamadas de Vercel Cron.

---

## 🛠️ Ejecución Local

```bash
# Entrar al directorio del dashboard
cd dashboard

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

Acceder a `http://localhost:3000`.

---

## 🌿 Flujo de Ramas Git

- **`main`**: Rama de producción lista para Vercel.
- **`develop`**: Rama de desarrollo activo para nuevas características y pruebas.
