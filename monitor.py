import os
import requests
import sys

# Constantes de Entorno
TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")

# Browser User-Agent to avoid being blocked by strict servers
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Reemplaza estas URLs con tu lista de 10 URLs reales.
# He incluido algunas URLs de prueba estandarizadas (httpstat.us) para simular fallos.
URLS = [
    "https://cga.com.py",
    "https://copemarketdeli.com.py",
    "https://dagda.com.py",
    "https://genesur.com.py",
    "https://naviosargentina.com",
    "https://portal.cga.com.py",
    "https://synexa.com.py",
]


def send_telegram_message(message):
    """Envía un mensaje a través de Telegram usando la API del Bot."""
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        print(
            "Error: Las variables TELEGRAM_TOKEN o TELEGRAM_CHAT_ID no están configuradas.")
        return

    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "HTML"
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        print("Notificación enviada a Telegram exitosamente.")
    except requests.exceptions.RequestException as e:
        print(f"Error al enviar el mensaje a Telegram: {e}")


def check_urls():
    """Revisa la lista de URLs buscando códigos distintos de 200 o timeouts mayores a 10s."""
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        print("Advertencia: No se han configurado credenciales de Telegram. Las notificaciones no se enviarán.\n")

    failed_sites = []

    for url in URLS:
        print(f"Revisando {url}...")
        try:
            # Petición GET con timeout de 10 segundos y User-Agent
            response = requests.get(
                url, headers={'User-Agent': USER_AGENT}, timeout=10)

            # Verificar si el código de estado NO es 200
            if response.status_code != 200:
                error_msg = f"Código de estado: {response.status_code}"
                failed_sites.append((url, error_msg))
                print(f"  ❌ Falló: {error_msg}")
            else:
                print("  ✅ OK")

        except requests.exceptions.Timeout:
            # Atrapa casos donde tarda más de 10 segundos
            error_msg = "Timeout (tardó más de 10 segundos en responder)"
            failed_sites.append((url, error_msg))
            print(f"  ❌ Falló: {error_msg}")

        except requests.exceptions.RequestException as e:
            # Atrapa errores de conexión (ej. dominio no existe, rechazo de conexión)
            error_msg = f"Error de conexión"
            failed_sites.append((url, error_msg))
            print(f"  ❌ Falló: {error_msg}")

    # Si hay sitios caídos, armamos y enviamos un solo mensaje con el reporte
    if failed_sites:
        print("\nSe detectaron sitios con problemas. Preparando alerta...")
        message = "🚨 <b>Alerta de Monitoreo de Uptime</b> 🚨\n\n"
        message += "Los siguientes sitios están experimentando problemas:\n\n"

        for url, error in failed_sites:
            message += f"• <code>{url}</code>\n  <i>{error}</i>\n"

        send_telegram_message(message)
    else:
        print("\n¡Todos los sitios están funcionando correctamente!")


if __name__ == "__main__":
    check_urls()
