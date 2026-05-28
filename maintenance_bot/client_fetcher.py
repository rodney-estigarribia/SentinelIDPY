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
    def fetch_all_data(client_url: str, matomo_period: str = 'month', matomo_date: str = 'today', matomo_prev_date: str = 'lastMonth', wf_start: int = None, wf_end: int = None) -> dict:
        """
        Consulta el endpoint del cliente y retorna el JSON completo.
        Returns None on failure (not empty dict) to allow proper null checking.
        """
        endpoint = f"{client_url}/wp-json/sentinel/v1/stats"
        headers = {
            'User-Agent': 'SentinelIDPY-MaintenanceBot/1.0',
            'X-WF-Report-Token': WF_REPORT_TOKEN,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        }
        import time
        params = {
            'token': WF_REPORT_TOKEN,
            'matomo_period': matomo_period,
            'matomo_date': matomo_date,
            'matomo_prev_date': matomo_prev_date,
            '_': int(time.time()),  # bypass caching plugins on client sites
        }
        if wf_start is not None:
            params['wf_start'] = wf_start
        if wf_end is not None:
            params['wf_end'] = wf_end

        try:
            logger.info(f"[FETCH] Starting request to: {endpoint}")
            response = requests.get(endpoint, headers=headers, params=params, timeout=15, verify=False)
            logger.info(f"[FETCH] Response status code: {response.status_code}")
            response.raise_for_status()
            data = response.json()
            logger.info(f"[FETCH] Success - Data keys received: {list(data.keys())}")

            # Diagnóstico de cada sección
            infra = data.get('infrastructure', {})
            if infra:
                logger.info(f"[FETCH] Infrastructure: disk_total_gb={infra.get('disk_total_gb')}, plugins_key_present=True")
            else:
                logger.warning(f"[FETCH] Infrastructure: MISSING from response")

            maintenance = data.get('maintenance', {})
            logger.info(f"[FETCH] Maintenance: total_active_plugins={maintenance.get('total_active_plugins', 'MISSING')}, pending={maintenance.get('pending_updates', 'MISSING')}")

            wf = data.get('wordfence', {})
            logger.info(f"[FETCH] Wordfence: total_attacks={wf.get('total_attacks', 'MISSING')}, top_ips_count={len(wf.get('top_ips', []))}")

            metricas = data.get('metricas')
            if metricas:
                logger.info(f"[FETCH] Metricas: nb_visits={metricas.get('nb_visits')}, nb_uniq_visitors={metricas.get('nb_uniq_visitors')}, bounce_rate={metricas.get('bounce_rate')}")
            else:
                matomo_debug = data.get('matomo_debug', 'sin detalle')
                logger.warning(f"[FETCH] Metricas: MISSING - matomo_debug='{matomo_debug}'")

            return data
        except requests.exceptions.Timeout as e:
            logger.error(f"[FETCH] Timeout error for {client_url}: {e}")
            return None
        except requests.exceptions.ConnectionError as e:
            logger.error(f"[FETCH] Connection error for {client_url}: {e}")
            return None
        except requests.exceptions.HTTPError as e:
            logger.error(f"[FETCH] HTTP error for {client_url}: {response.status_code if 'response' in locals() else 'unknown'} - {e}")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"[FETCH] Request error for {client_url}: {e}")
            return None
        except Exception as e:
            logger.error(f"[FETCH] Unexpected error from {client_url}: {type(e).__name__} - {e}")
            return None

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

        # Normalizar datos del mes anterior (para trends)
        prev = metricas.get('prev_month', {})
        prev_bounce_raw = prev.get('bounce_rate', '0%')
        if isinstance(prev_bounce_raw, str):
            prev_bounce = float(prev_bounce_raw.replace('%', '').strip() or 0)
        else:
            prev_bounce = float(prev_bounce_raw)

        prev_month = {
            'nb_visits': int(prev.get('nb_visits', 0)),
            'nb_uniq_visitors': int(prev.get('nb_uniq_visitors', 0)),
            'avg_time_on_site': int(prev.get('avg_time_on_site', 0)),
            'bounce_rate': prev_bounce,
            'nb_actions_per_visit': float(prev.get('nb_actions_per_visit', 0)),
        } if prev else {}

        # Normalizar bounce_rate de dispositivos
        devices = []
        for dev in metricas.get('devices', []):
            br = dev.get('bounce_rate', '0%')
            if isinstance(br, str):
                br = float(br.replace('%', '').strip() or 0)
            else:
                br = float(br)
            devices.append({
                'label': dev.get('label', ''),
                'nb_visits': int(dev.get('nb_visits', 0)),
                'bounce_rate': br,
            })

        # Top browsers (top 2)
        browsers = []
        for b in metricas.get('browsers', [])[:2]:
            browsers.append({
                'label': b.get('label', ''),
                'nb_visits': int(b.get('nb_visits', 0)),
            })

        # Top OS families (top 2)
        os_families = []
        for o in metricas.get('os_families', [])[:2]:
            os_families.append({
                'label': o.get('label', ''),
                'nb_visits': int(o.get('nb_visits', 0)),
            })

        # Normalizar exit_rate de páginas de salida (Matomo puede devolver "67%" string)
        exit_pages = []
        for ep in metricas.get('exit_pages', [])[:5]:
            er = ep.get('exit_rate', 0)
            if isinstance(er, str):
                er = float(er.replace('%', '').strip() or 0)
            else:
                er = float(er)
            exit_pages.append({
                'label': ep.get('label', ''),
                'nb_visits': int(ep.get('nb_visits', 0)),
                'exit_rate': er,
            })

        return {
            'nb_visits': int(metricas.get('nb_visits', 0)),
            'nb_uniq_visitors': int(metricas.get('nb_uniq_visitors', 0)),
            'nb_actions': int(metricas.get('nb_actions', 0)),
            'nb_actions_per_visit': float(metricas.get('nb_actions_per_visit', 0)),
            'avg_time_on_site': avg_time_seconds,
            'bounce_rate': bounce_rate,
            'top_pages': top_pages,
            'prev_month': prev_month,
            'devices': devices,
            'browsers': browsers,
            'os_families': os_families,
            'exit_pages': exit_pages,
            'conversions': metricas.get('conversions'),
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
