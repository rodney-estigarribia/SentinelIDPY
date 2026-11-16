# Plan Técnico: Monitor Uptime

## Phase 1: Impact Analysis
*   **Componentes/Servicios Afectados:** Ninguno. Se trata de un proyecto completamente nuevo y aislado (`monitor-uptime`).
*   **Efectos Secundarios (Regressions):** Ninguno en el código existente. A nivel de infraestructura, el script consumirá minutos de ejecución de GitHub Actions (dentro de la capa gratuita) y realizará peticiones HTTP inofensivas a los sitios web configurados.

## Phase 2: Technical Plan
*   **Estructura del Proyecto:**
    *   `monitor.py`: El script principal de Python.
    *   `requirements.txt`: Para gestionar la dependencia de `requests`.
    *   `.github/workflows/main.yml`: La configuración para GitHub Actions.
*   **Cambios Lógicos (Script Python):**
    *   Importar las librerías `requests` y `os`.
    *   Obtener las variables de entorno `TELEGRAM_TOKEN` y `TELEGRAM_CHAT_ID`.
    *   Iterar sobre la lista de las 10 URLs.
    *   Realizar una petición `GET` a cada URL definiendo un bloque `try/except` para atrapar errores de conexión.
    *   Establecer un `timeout=10` en la petición.
    *   Validar que el `status_code` sea igual a `200`.
    *   Si ocurre un error (timeout, error de conexión) o el código no es 200, hacer una petición POST a la API de Telegram para notificar con el nombre del sitio fallido y la causa.
*   **GitHub Actions (`main.yml`):**
    *   Usar un disparador `schedule` con la sintaxis cron `*/30 * * * *` para que se ejecute cada 30 minutos.
    *   Definir un *job* que configure Python, instale las dependencias desde `requirements.txt` y ejecute `monitor.py`.
    *   Inyectar los secretos (tokens) de GitHub como variables de entorno al script.

## Phase 3: Testing Strategy
*   **Reproduction:** El script fue probado localmente agregando URLs conocidas que devuelven errores específicos (ej. `http://httpstat.us/500` para simular un código interno y `http://httpstat.us/200?sleep=11000` para forzar un timeout de más de 10 segundos).
*   **Verification:** Se comprobó la lógica del armado del mensaje y el formato HTML para la API de Telegram, además de incluir `try/except` envolviendo la petición de Telegram para evitar fallos si el API temporalmente falla o si las credenciales no existen localmente.
*   **Edge Cases Validados:**
    *   Sitio web que no existe o tiene problemas de resolución DNS.
    *   Credenciales de Telegram faltantes o incorrectas (notificadas por consola).
    *   Fallos en el envío del mensaje a Telegram.
