import requests
import logging
import os

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

        try:
            response = requests.get(endpoint, headers=headers, timeout=15, verify=True)
            response.raise_for_status()
            data = response.json()
            return data.get('infrastructure', {})
        except requests.exceptions.RequestException as e:
            logger.error(f"Error consultando infraestructura de {client_url}: {e}")
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
