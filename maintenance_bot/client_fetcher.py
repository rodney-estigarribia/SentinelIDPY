import requests
import logging
import os
import ssl
import socket
from datetime import datetime
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Token de seguridad (debe coincidir con el plugin PHP)
WF_REPORT_TOKEN = os.getenv("WF_REPORT_TOKEN", "your_32_character_secure_hash_here_123")

class ClientDataFetcher:
    """Consulta datos de infraestructura y almacenamiento desde los clientes."""

    @staticmethod
    def fetch_infrastructure_data(client_url: str) -> dict:
        """
        Consulta el endpoint del cliente para obtener datos de infraestructura.
        Retorna un diccionario con los datos de almacenamiento o None si falla.
        """
        endpoint = f"{client_url}/wp-json/sentinel/v1/stats"
        headers = {
            'User-Agent': 'SentinelIDPY-MaintenanceBot/1.0',
            'X-WF-Report-Token': WF_REPORT_TOKEN
        }
        params = {
            'token': WF_REPORT_TOKEN
        }

        try:
            logger.info(f"Fetching infrastructure data from: {endpoint}")
            logger.info(f"Token length: {len(WF_REPORT_TOKEN)}")
            logger.info(f"Headers being sent: {headers}")
            logger.info(f"Query params being sent: token={WF_REPORT_TOKEN[:10]}...")

            response = requests.get(endpoint, headers=headers, params=params, timeout=15, verify=False)
            logger.info(f"Response status code: {response.status_code}")
            logger.info(f"Response headers: {dict(response.headers)}")

            response.raise_for_status()
            data = response.json()
            logger.info(f"Full response data: {data}")
            infra_data = data.get('infrastructure', {})
            logger.info(f"Successfully fetched infrastructure data: {infra_data}")
            return infra_data
        except requests.exceptions.RequestException as e:
            logger.error(f"Error consultando infraestructura de {client_url}: {e}")
            logger.error(f"Response text: {e.response.text if hasattr(e, 'response') and e.response is not None else 'N/A'}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching infrastructure from {client_url}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None

    @staticmethod
    def obtener_dias_ssl(url: str) -> int:
        """
        Conecta al dominio y extrae la fecha de expiración del certificado SSL.
        Retorna la cantidad de días restantes, o None si hay error.
        """
        try:
            hostname = urlparse(url).hostname or url.replace('https://', '').replace('http://', '').split('/')[0]
            logger.info(f"Checking SSL certificate for: {hostname}")

            ctx = ssl.create_default_context()
            with socket.create_connection((hostname, 443), timeout=5) as sock:
                with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()

            not_after = cert.get('notAfter')
            if not not_after:
                logger.warning(f"No notAfter field in certificate for {hostname}")
                return None

            expiry_date = datetime.strptime(not_after, '%b %d %H:%M:%S %Y %Z')
            days_left = (expiry_date - datetime.utcnow()).days
            logger.info(f"SSL for {hostname}: expires {not_after}, {days_left} days left")
            return days_left

        except (socket.timeout, socket.gaierror) as e:
            logger.error(f"SSL connection timeout/DNS error for {url}: {e}")
            return None
        except Exception as e:
            logger.error(f"SSL check error for {url}: {e}")
            return None

    @staticmethod
    def format_storage(infra_data: dict) -> str:
        """
        Convierte datos de almacenamiento en texto amigable.
        Si el uso supera 80%, retorna una advertencia.
        """
        if not infra_data:
            return None

        used_gb = infra_data.get('disk_used_gb', 0)
        total_gb = infra_data.get('disk_total_gb', 0)
        percentage = infra_data.get('disk_used_percentage', 0)

        if percentage >= 80:
            return f"⚠️ Tu espacio en disco está llegando al límite. {used_gb} GB usados de {total_gb} GB totales ({percentage}% lleno). Recomendamos una limpieza o ampliación próximamente."
        else:
            return f"Contás con muy buen espacio disponible. {used_gb} GB usados de {total_gb} GB totales ({percentage}% lleno)."
