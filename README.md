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
 ┃ ┗ 📜 PROJECT.md     # Documentación principal del proyecto
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

## 🤖 4. Módulo: Telegram Maintenance Bot (Mantenimiento Proactivo)

Este bot interactivo permite documentar tareas manuales, procesar explicaciones técnicas con IA (Ollama) y generar reportes PDF Premium para clientes con evidencia visual (Antes/Después).

### Características:
- **IA Local**: Conexión con Ollama (`qwen2.5-coder:1.5b`) para redactar bitácoras profesionales.
- **Seguridad**: Lista blanca de usuarios (`ALLOWED_USERS`) y sanitización de rutas.
- **Reportes Premium**: Generación de PDFs vía HTML/CSS con **WeasyPrint** para un diseño superior.
- **Dockerizado**: Despliegue sencillo con Docker Compose y volúmenes persistentes.

### Despliegue y Uso:

1. **Configuración de Clientes**: Edita `maintenance_bot/clientes.json` con los datos de tus clientes.
2. **Variables de Entorno**:
   - Copia `maintenance_bot/.env.example` a `maintenance_bot/.env`.
   - Define tu `TELEGRAM_TOKEN`.
   - Añade tu ID de usuario en `ALLOWED_USERS` (ej: `12345678,98765432`).
3. **Ejecución con Docker**:
   ```bash
   cd maintenance_bot
   docker-compose up --build -d
   ```
4. **Uso en Telegram**:
   - Envía el comando `/revisar` al bot.
   - Sigue el flujo interactivo: Seleccionar cliente -> Escribir bitácora -> Validar IA -> Subir fotos (o `/skip`) -> Recibir PDF.

### Pruebas y Desarrollo (Generador de PDF):

Si realizas cambios en el diseño del PDF (HTML/CSS) y deseas previsualizar el resultado sin usar Telegram:
1. Asegúrate de tener instaladas las dependencias: `pip install weasyprint`.
2. Ejecuta el generador con el bloque de datos de prueba:
   ```bash
   python3 maintenance_bot/html_pdf_generator.py
   ```
3. El reporte de prueba se generará en: `reportes/test_html_executive.pdf`.

---

© 2026 SentinelIDPY - Rodney Mendoza
