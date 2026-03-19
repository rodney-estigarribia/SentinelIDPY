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
    def fetch_all_data(client_url: str) -> dict:
        """
        Consulta el endpoint del cliente y retorna el JSON completo.
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
            logger.info(f"Fetching data from: {endpoint}")
            response = requests.get(endpoint, headers=headers, params=params, timeout=15, verify=False)
            logger.info(f"Response status code: {response.status_code}")
            response.raise_for_status()
            data = response.json()
            logger.info(f"Data keys received: {list(data.keys())}")
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"Error consultando {client_url}: {e}")
            return {}
        except Exception as e:
            logger.error(f"Unexpected error from {client_url}: {e}")
            return {}

    @staticmethod
    def extract_metrics(data: dict) -> dict:
        """Extrae y normaliza metricas de Matomo del response."""
        metricas = data.get('metricas')
        if not metricas:
            return None

        # Normalizar bounce_rate de "45%" string a float
        bounce_raw = metricas.get('bounce_rate', '0%')
        if isinstance(bounce_raw, str):
            bounce_rate = float(bounce_raw.replace('%', '').strip() or 0)
        else:
            bounce_rate = float(bounce_raw)

        avg_time_seconds = int(metricas.get('avg_time_on_site', 0))
        top_pages = metricas.get('top_pages', [])[:3]

        return {
            'nb_visits': int(metricas.get('nb_visits', 0)),
            'nb_uniq_visitors': int(metricas.get('nb_uniq_visitors', 0)),
            'nb_actions': int(metricas.get('nb_actions', 0)),
            'nb_actions_per_visit': float(metricas.get('nb_actions_per_visit', 0)),
            'avg_time_on_site': avg_time_seconds,
            'bounce_rate': bounce_rate,
            'top_pages': top_pages,
        }

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
