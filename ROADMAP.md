# 🗺️ SentinelIDPY — Master Roadmap & Plan de Evolución

> **Estado General:** 🟢 Fase 1 Completada (Core & UI/UX) | 🟡 Fase 2 en Curso (Despliegue & Conexión)  
> **Última actualización:** 21 de Septiembre, 2026  
> **Entorno:** Next.js 15 App Router | Tailwind CSS v4 | Drizzle ORM | Neon Serverless Postgres | Vercel

Este documento es la **fuente única de verdad** sobre el avance, los frentes abiertos y las próximas características de **SentinelIDPY**. A medida que completemos o agreguemos tareas, este archivo se irá actualizando para tener siempre visibilidad instantánea de dónde estamos parados.

---

## 📊 Progreso General

```
[████████████████████░░░░░░░░] 72% Completado
- Fase 1: Core Dashboard & UI/UX               100% [████████████████████]
- Fase 2: Despliegue en la Nube & Conexión     100% [████████████████████]
- Fase 3: CRM, Inventario & Facturación          30% [██████░░░░░░░░░░░░░░]
- Fase 4: Mantenimiento Autónomo & Reportes PDF   10% [██░░░░░░░░░░░░░░░░░░]
- Fase 5: Operaciones Avanzadas (Backups/CI-CD)   30% [██████░░░░░░░░░░░░░░]
```

---

## ✅ FASE 1: Core Dashboard, Arquitectura & UI/UX (COMPLETADA)

- [x] **Arquitectura del Dashboard en Next.js 15 (App Router)**:
  - [x] 26 rutas operativas con compilación de producción limpia (`npx next build --webpack`).
  - [x] Autenticación segura mediante sesión y 2FA TOTP (Google Authenticator / Authy).
  - [x] Estructura serverless optimizada para capa gratuita de Vercel y Neon Postgres.
- [x] **Modelo de Datos Multi-Activo (Drizzle ORM)**:
  - [x] Esquemas para Clientes, Sitios/Servicios, Grupos, Plantillas de Configuración y Logs.
  - [x] Desglose de infraestructura completa: Dominios (nic.py), Hosting (cPanel), DNS, Correos (M365, Workspace, cPanel), Servidores Cloud (Render) y Apps Móviles.
  - [x] Adaptador en memoria con clientes reales de prueba (`clientes.json`) para desarrollo sin base de datos obligatoria.
- [x] **Cockpit & Agrupación de Servicios**:
  - [x] Agrupación por sistemas (`Plataforma Dagda`, `Sistemas Empresariales`, `General`).
  - [x] Mapeo de dependencias entre activos (*apunta a, aloja, depende de, conecta con*).
  - [x] Vista Cockpit detallada por servicio (`/services/[id]`).
- [x] **Auditoría Visual & Soporte Bivalente (Light / Dark Mode)**:
  - [x] Detección automática de preferencia del sistema operativo y selector manual de tema.
  - [x] Corrección integral de contrastes WCAG AAA (`slate-950` sobre fondos claros, `white` sobre oscuros).
  - [x] Eliminación de degradados discordantes; cabeceras planas unificadas (`bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800`).
  - [x] Estados de hover suaves y legibles en tablas y tarjetas.
  - [x] Corrección del selector de filtros en `/updates` para máxima legibilidad en modo claro y oscuro.
- [x] **Librería de Componentes Centralizada (`dashboard/src/components/ui/`)**:
  - [x] `<Badge>`: Variantes contrastadas (`indigo`, `emerald`, `amber`, `red`, `sky`, `blue`, `purple`, `cyan`, `neutral`) con soporte de iconos.
  - [x] `<Note>`: Callouts técnicos para alertas y roadmap notes (`warning`, `info`, `danger`, `success`, `neutral`).
  - [x] `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>`.
  - [x] `<Input>`, `<Select>`, `<Label>`, `<Textarea>`, `<Checkbox>`.
  - [x] `<Button>` con variantes de acción.

---

## ✅ FASE 2: Despliegue en la Nube & Conexión Real WordPress (COMPLETADA)

- [x] **Despliegue en Vercel**:
  - [x] Subir las ramas `main` y `develop` a GitHub (`git push origin main`).
  - [x] Importar proyecto en Vercel con Root Directory en `dashboard` y Framework `nextjs`.
  - [x] Configurar variables de entorno (`OTP_SECRET`, `SESSION_SECRET`, `WF_REPORT_TOKEN`, `DATABASE_URL`).
- [x] **Base de Datos Persistente (Neon Postgres)**:
  - [x] Conectar base de datos Neon Serverless Postgres.
  - [x] Sincronizar e inicializar tablas en Neon (`/api/admin/init-db`).
  - [x] Verificar persistencia de clientes, servicios y cambios de estado con fallback resiliente en memoria.
- [x] **Puesta en Marcha del Conector WordPress (v4.2)**:
  - [x] Plugin `sentinel-idpy-connector.php` instalado y activo en todos los clientes.
  - [x] Auto-actualizador de plugin vía GitHub Releases configurado en CI/CD.
  - [x] Autenticación dual robusta (`X-WF-Report-Token` header + `?token=` query parameter fallback).
- [x] **Orquestación Real de Operaciones WordPress (Frente B & C)**:
  - [x] `/api/sites/[id]/updates/apply`: Ejecución real de actualizaciones masivas e individuales (plugins, temas, core) con invalidación de OPcache.
  - [x] `/api/sites/[id]/updates/refresh`: Sincronización en tiempo real de actualizaciones pendientes desde WordPress hacia Neon.
  - [x] `/api/sites/[id]/plugins`: Listado en vivo, despliegue masivo desde WP.org y alternancia activa/inactiva.
  - [x] `/api/sites/[id]/users`: Listado de usuarios de WordPress y flujo oficial de reseteo de contraseña.
  - [x] `/api/sites/[id]/backups`: Disparo de respaldos remotos vía UpdraftPlus.
  - [x] `/api/sites/[id]/performance`: Purga remota de caché (LiteSpeed, WP Super Cache, OPcache).
  - [x] `/api/sites/[id]/agency`: Sincronización de marca blanca y widgets de escritorio.
  - [x] Registro automático de auditoría en `activity_logs`.

---

## 🔵 FASE 3: CRM, Inventario de Clientes & Facturación (PRÓXIMO)

- [x] **Base inicial maquetada**:
  - [x] Campos de costos, moneda (PYG / USD) y ciclos de facturación (mensual / anual).
  - [x] Clasificación de responsabilidad: `tc_cliente`, `incluido`, `tc_agencia` (TC Rodney ⚠️).
  - [x] Registro de notas de deuda técnica y roadmap comercial por activo.
- [ ] **Módulo CRM Avanzado**:
  - [ ] Vista financiera consolidada: Sumatoria de costos de infraestructura por cliente y por agencia.
  - [ ] Alertas de vencimiento de dominios y hosting (30 días, 15 días, 7 días antes de expirar).
  - [ ] Semáforo de riesgo para activos bajo `tc_agencia` pendientes de transferir a tarjeta del cliente.
  - [ ] Registro de contactos clave por cliente (nombre, rol, WhatsApp, email, teléfono de soporte).
  - [ ] Histórico de cotizaciones, presupuestos o paquetes contratados por cliente.

---

## 🟣 FASE 4: Mantenimiento Autónomo & Reportes Ejecutivos (PLANIFICADO)

- [ ] **Vercel Cron & Monitoreo Autónomo**:
  - [ ] Cron de Uptime cada 10 minutos (`/api/cron/uptime`) con autenticación `CRON_SECRET`.
  - [ ] Cron diario (`/api/cron/daily-rollup`) para consolidar históricos de respuesta sin sobrecargar la base de datos.
- [ ] **Canales de Alerta en Tiempo Real**:
  - [ ] Integración activa con Bot de Telegram para avisos inmediatos de caída HTTP o ataques masivos.
  - [ ] Notificaciones por Email (Resend / SMTP) y WhatsApp Webhook.
- [ ] **Generador de Reportes de Mantenimiento**:
  - [ ] Reemplazar los scripts de `bot/` por un motor nativo de generación de reportes en SentinelIDPY.
  - [ ] Programar ejecución de mantenimiento preventivo mensual por cliente.
  - [ ] Generación automática de PDF ejecutivo (actualizaciones realizadas, ataques bloqueados, estado de backups, score de salud).
  - [ ] Envío automático del PDF al cliente por correo o WhatsApp con la identidad visual de *Impulsos Digitales*.

---

## ⚪ FASE 5: Operaciones Avanzadas & White-Labeling (FUTURO)

- [ ] **White-Labeling & Personalización Remota de WordPress**:
  - [ ] Subida de logo de login y background de acceso a WordPress desde el panel central sin loguearse al sitio (`/sentinel/v1/agency/branding`).
  - [ ] Integración con Admin Menu Editor para ocultar secciones del menú a usuarios del cliente.
  - [ ] Limpieza automática de widgets innecesarios en el escritorio de WordPress.
- [ ] **Auditoría de Drift y Sincronización de Plantillas Doradas**:
  - [ ] Ejecutar auditoría periódica de drift contra la plantilla recomendada (`Gold Standard`).
  - [ ] Botón de auto-remediación para sobreescribir configuraciones desviadas con 1 clic.
- [ ] **Backups Autónomos Nativos (Fase 2 de Backups)**:
  - [ ] Conector de respaldo independiente dentro de SentinelIDPY.
  - [ ] Soporte multi-destino sin licencias de terceros: AWS S3, Cloudflare R2, Google Drive o SFTP propio.
- [ ] **Analítica Avanzada & Geolocalización**:
  - [ ] Geolocalización de IPs mediante APIs gratuitas (ip-api) para estadísticas geográficas de visitas.
  - [ ] Conexión de lectura opcional con Matomo para sitios de mayor escala.

---

## 📝 Registro de Cambios & Hitos Alcanzados (Changelog)

- **2026-09-21**:
  - Creada librería de componentes estandarizada en `@/components/ui` (`Badge`, `Note`, `Card`, `Form`, `Button`).
  - Resuelto contraste y legibilidad en Modo Claro y Modo Oscuro en todas las vistas (`/services`, `/clients`, `/settings`, `/templates`, `/agency`, `/analytics`, `/updates`).
  - Eliminados degradados discordantes; cabeceras estandarizadas en tarjetas planas tipo Seguridad.
  - Creación del documento oficial `ROADMAP.md`.
- **2026-09-20**:
  - Arquitectura multi-servicio: Dominios, hosting, DNS, correos, servidores Cloud y apps móviles.
  - Cockpit de servicios y gestión de agrupaciones por sistema (`service_groups`).
  - Integración de 2FA TOTP para inicio de sesión seguro.
  - Definición del plan maestro de almacenamiento para 100+ clientes en capa gratuita de Neon/Vercel.
