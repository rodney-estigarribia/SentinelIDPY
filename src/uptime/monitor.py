import os
import requests
import sys
import html
import json

# Constantes de Entorno
TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")

if not all([TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]):
    raise ValueError("Faltan variables de entorno críticas (TELEGRAM_TOKEN o TELEGRAM_CHAT_ID). Operación abortada.")

# Browser User-Agent to avoid being blocked by strict servers
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Cargar sitios desde archivo JSON centralizado
SITES_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "sites.json")

try:
    with open(SITES_FILE, "r") as f:
        SITES = json.load(f)
except FileNotFoundError:
    print(f"Error: No se encontró el archivo de configuración de sitios en {SITES_FILE}.")
    print("Asegúrate de crear 'sites.json' en la raíz del proyecto.")
    sys.exit(1)
except json.JSONDecodeError:
    print(f"Error: El archivo {SITES_FILE} no tiene un formato JSON válido.")
    sys.exit(1)

RETRY_TIMEOUT = 30  # segundos


def send_telegram_message(message):
    """Envía un mensaje a través de Telegram usando la API del Bot."""
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "HTML"
    }

    try:
        response = requests.post(url, json=payload, timeout=10, verify=True)
        response.raise_for_status()
        print("Notificación enviada a Telegram exitosamente.")
    except requests.exceptions.RequestException as e:
        print(f"Error al enviar el mensaje a Telegram: {e}")


def check_urls():
    """Revisa la lista de URLs buscando códigos distintos de 200 o timeouts mayores a 10s."""
    failed_sites = []

    for site in SITES:
        name = site.get("name", "Desconocido")
        url = site.get("url")
        
        if not url:
             continue
             
        print(f"Revisando {name} ({url})...")
        try:
            # Petición GET con headers de navegador para evitar bloqueos por seguridad (err 415/403)
            headers = {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Upgrade-Insecure-Requests': '1'
            }
            response = requests.get(url, headers=headers, timeout=RETRY_TIMEOUT, verify=True)

            # Verificar si el código de estado NO es 200
            SUCCESS_STATUS = [200, 301]
            if response.status_code not in SUCCESS_STATUS:
                error_msg = f"Código de estado: {response.status_code}"
                failed_sites.append((url, error_msg))
                print(f"  ❌ Falló: {error_msg}")
            else:
                print("  ✅ OK")

        except requests.exceptions.Timeout:
            # Atrapa casos donde tarda más de X segundos
            error_msg = f"Timeout (tardó más de {RETRY_TIMEOUT} segundos en responder)"
            failed_sites.append((url, error_msg))
            print(f"  ❌ Falló: {error_msg}")

        except requests.exceptions.RequestException as e:
            # Atrapa errores de conexión (ej. dominio no existe, rechazo de conexión, SSL)
            error_msg = f"Error de red: {str(e)}"
            failed_sites.append((url, error_msg))
            print(f"  ❌ Falló: {error_msg}")

    # Si hay sitios caídos, armamos y enviamos un solo mensaje con el reporte
    if failed_sites:
        print("\nSe detectaron sitios con problemas. Preparando alerta...")
        message = "🚨 <b>Alerta de Monitoreo de Uptime</b> 🚨\n\n"
        message += "Los siguientes sitios están experimentando problemas:\n\n"

        for url, error in failed_sites:
            # Re-buscar el nombre del sitio correspondiente (solución simple para evitar modificar la tupla)
            site_name = next((s.get("name", "Desconocido") for s in SITES if s.get("url") == url), "Desconocido")
            safe_name = html.escape(site_name)
            safe_url = html.escape(url)
            safe_error = html.escape(error)
            message += f"• <b>{safe_name}</b> (<code>{safe_url}</code>)\n  <i>{safe_error}</i>\n"

        send_telegram_message(message)
    else:
        print("\n¡Todos los sitios están funcionando correctamente!")


if __name__ == "__main__":
    check_urls()
