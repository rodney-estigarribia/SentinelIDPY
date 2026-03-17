# SentinelIDPY

Este repositorio centraliza herramientas esenciales para el mantenimiento y monitoreo de sitios web bajo la gestión de **SentinelIDPY**.

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
 ┃ ┃ ┗ 📜 report.py    # Generador de reportes PDF mensuales enriquecidos
 ┃ ┗ 📂 wordpress-plugin
 ┃   ┗ 📜 sentinel-idpy-connector.php # Plugin para extraer métricas de salud y seguridad
 ┣ 📂 docs             # Documentación técnica y roadmaps
 ┣ 📜 sites.json       # Configuración global (URLs de los clientes)
 ┣ 📜 requirements.txt # Dependencias de Python
 ┣ 📜 mock_sentinel_server.py # Servidor de pruebas para desarrollo
 ┗ 📜 README.md
```

---

## 🚀 1. Módulo: Uptime Monitor

Revisa la lista de sitios en `sites.json` y alerta por Telegram **solo** si hay fallos (Timeout > 10s, Código diferente a 200, o Errores SSL).

### Configuración de Sitios
Edita `sites.json` en la raíz del proyecto:
```json
[
  {
    "name": "Nombre del Cliente",
    "url": "https://url-del-cliente.com"
  }
]
```

---

## 🛡️ 2. Módulo: SentinelIDPY Connector (Reportes Mensuales)

Este módulo extrae métricas profundas de salud, infraestructura y seguridad directamente desde WordPress, genera un reporte PDF profesional y lo envía por Telegram.

### Métricas Extraídas:
- **Infraestructura**: Espacio en disco (libre/total), versión de PHP y WordPress.
- **Mantenimiento**: Último backup exitoso (UpdraftPlus), últimos 5 plugins actualizados y score de "Site Health".
- **Seguridad**: Días restantes del certificado SSL, ataques bloqueados (Wordfence) y último escaneo de malware.

### A. Configuración en WordPress (Clientes)
1. Sube el archivo `src/wordpress-plugin/sentinel-idpy-connector.php` a la carpeta de plugins de tu WordPress o instálalo vía el gestor de plugins.
2. **Seguridad**: Genera un Hash largo (32+ caracteres) y actualiza la constante `WF_REPORT_TOKEN_INTERNAL` en el archivo PHP.
3. El plugin expone un endpoint protegido en: `https://tusitio.com/wp-json/sentinel/v1/stats`.

### B. Configuración de Python
El script `src/reporting/report.py` leerá la lista de sitios y consultará el endpoint de cada uno utilizando el Token de seguridad configurado.

---

## ⚙️ 3. Despliegue Automatizado (GitHub Actions)

Configura los siguientes **Secrets** en tu repositorio de GitHub (**Settings > Secrets and variables > Actions**):

- `TELEGRAM_TOKEN`: El token de tu bot de Telegram.
- `TELEGRAM_CHAT_ID`: El ID numérico del chat o grupo de recepción.
- `WF_REPORT_TOKEN`: El Token de 32+ caracteres definido en el plugin de WordPress.

Las automatizaciones se ejecutan según los cronjobs definidos en `.github/workflows/`. Puedes forzar una ejecución manual desde la pestaña **Actions** seleccionando el workflow correspondiente.
