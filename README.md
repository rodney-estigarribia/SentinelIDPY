# Uptime Monitor

Un script simple en Python para monitorear el uptime (disponibilidad) de tus sitios web. El script revisa una lista de URLs, y si alguna de ellas falla (devuelve un código HTTP diferente de 200 o tarda más de 10 segundos en responder), enviará una notificación a través de un bot de Telegram.

Este repositorio está preparado para ejecutarse automáticamente cada 30 minutos utilizando [GitHub Actions](https://github.com/features/actions).

## 🚀 Siguientes Pasos (Tu configuración)

Para poner a funcionar este monitor, debes seguir estos pasos:

### 1. Configurar las URLs
Crea o edita el archivo `sites.json` en la raíz de tu proyecto. Este archivo centralizado alimenta a todos los scripts del sistema.

```json
[
  {
    "name": "Mi Sitio",
    "url": "https://tusitio.com"
  }
]
```
# SentinelIDPY

Este repositorio contiene dos herramientas esenciales para el mantenimiento de sitios web:
1. **Uptime Monitor**: Un script en Python que revisa el estado de una lista de dominios cada 30 minutos y alerta por Telegram si alguno está caído.
2. **Wordfence Security Reporter**: Un sistema compuesto por un snippet PHP para WordPress y un script Python que genera un reporte PDF mensual sobre ataques bloqueados.

---

## Estructura del Proyecto

```bash
📦 SentinelIDPY
 ┣ 📂 .github
 ┃ ┗ 📂 workflows
 ┃   ┣ 📜 main.yml     # Cron job para el Uptime Monitor (cada 30 min)
 ┃   ┗ 📜 report.yml   # Cron job para el Reporte PDF (1 vez al mes)
 ┣ 📂 src
 ┃ ┣ 📂 uptime
 ┃ ┃ ┗ 📜 monitor.py   # Motor principal del monitor de sitios caídos
 ┃ ┣ 📂 reporting
 ┃ ┃ ┗ 📜 report.py    # Motor generador del reporte PDF mensual (vía fpdf2)
 ┃ ┗ 📂 wordpress-plugin
 ┃   ┗ 📜 wordfence-api-snippet.php # Snippet para exponer métricas de WP
 ┃   ┗ 📜 mock_wp_test.py           # Herramienta de pruebas local
 ┣ 📂 docs
 ┃ ┗ 📜 wordfence_plugin_v2_roadmap.md # Documentación del Roadmap para la V2 del Plugin WP
 ┣ 📜 sites.json       # Archivo de configuración global (URLs de los clientes)
 ┣ 📜 requirements.txt # Dependencias de Python
 ┗ 📜 README.md
```

---

## 🚀 1. Configuración: Uptime Monitor

Este módulo revisa tu lista de sitios y alerta **solo** si hay fallos (Timeout, Código 500, o Errores SSL).

### Requisitos Locales (Pruebas)
Solo necesitas definir dos variables de entorno usando tu bot de Telegram:
```bash
export TELEGRAM_TOKEN="tu_token_recibido_de_botfather"
export TELEGRAM_CHAT_ID="tu_chat_id_numerico"
```

### Configuración de Sitios
Asegúrate de agregar todos los sitios que quieras monitorizar en el archivo global `sites.json`.

---

## 🛡️ 2. Configuración: Wordfence Security Reporter

Este módulo extrae métricas de ataques directamente desde la tabla `wp_wfHits` de Wordfence, arma un PDF, y lo envía por Telegram. Posee un fuerte **Security Hardening** contra ataques Man-In-The-Middle y Fuerza Bruta.

### A. Lado WordPress (Tus Sitios)
Este script debe instalarse en **cada** sitio WordPress que quieras auditar utilizando la versión "zero-config" (V1).

1. Abre el archivo `src/wordpress-plugin/wordfence-api-snippet.php` en tu editor.
2. Genera un Hash largo o [UUID v4](https://www.uuidgenerator.net/) seguro (Ej: `f47ac10b-58cc-4372-a567-0e02b2c3d479`). El código php rechazará matemáticamente cualquier token menor a 32 caracteres.
3. Modifica la constante interna `WF_REPORT_TOKEN_INTERNAL` con el hash que generaste.
4. Una vez hecho esto, puedes instalar este archivo `wordfence-api-snippet.php` como un plugin o usar un gestor de Snippets (ej: Code Snippets) en todos tus clientes. Ya no es necesario tocar el `wp-config.php`.

*Nota: Existe un plan de evolución estructurado detallando la migración hacia una Versión 2 autogestionada en [`docs/wordfence_plugin_v2_roadmap.md`](docs/wordfence_plugin_v2_roadmap.md).*

### B. Lado Python (Este repositorio)
Asegúrate de que la URL del dominio donde subiste el plugin esté listado exactamente en el archivo `sites.json`, ya que el reporte leerá la lista global antes de generar el PDF.

---

## ⚙️ 3. Despliegue Automatizado (GitHub Actions)

Para que el proyecto se ejecute solo (sin necesidad de tener un servidor), ambos modulos usan GitHub Actions. 

Dirígete a **Settings > Secrets and variables > Actions** en este repositorio de GitHub y crea los siguientes 3 Secrets obligatorios:

- `TELEGRAM_TOKEN`: El token de tu bot de Telegram.
- `TELEGRAM_CHAT_ID`: El ID numérico donde recibirás los reportes.
- `WF_REPORT_TOKEN`: El Token de 32+ caracteres que "quemaste" hardcodeado en tu `wordfence-api-snippet.php`.

Las automatizaciones funcionarán automáticamente según el horario cron en los YML. Si quieres ejecutar un reporte *ahora mismo*, ve a la pestaña **Actions**, selecciona "Monthly Wordfence Report" o "Uptime Monitor" y haz click en "Run Workflow".
