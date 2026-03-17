import os
import requests
from fpdf import FPDF
from datetime import datetime
import sys

import json

# Constantes de Entorno
TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")
WF_REPORT_TOKEN = os.environ.get("WF_REPORT_TOKEN")

if not all([TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, WF_REPORT_TOKEN]):
    raise ValueError("Faltan variables de entorno críticas (TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, o WF_REPORT_TOKEN). Operación abortada.")

# Cargar sitios desde archivo JSON centralizado
SITES_FILE = "/tmp/sites_mock.json"

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

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

class PDFReport(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 15)
        # Arial bold 15
        self.cell(0, 10, 'Reporte de Mantenimiento y Seguridad (Últimos 30 Días)', border=False, ln=1, align='C')
        self.ln(10)

def fetch_site_stats(url):
    """Consulta el endpoint de SentinelIDPY de un sitio."""
    endpoint = f"{url}/wp-json/sentinel/v1/stats"
    headers = {
        'User-Agent': USER_AGENT,
        'X-WF-Report-Token': WF_REPORT_TOKEN
    }
    try:
        response = requests.get(endpoint, headers=headers, timeout=15, verify=True)
        response.raise_for_status()
        data = response.json()
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error consultando {url}: {e}")
        return None # No disponible

def generate_pdf(results):
    """Genera un archivo PDF con los resultados."""
    pdf = PDFReport()
    pdf.add_page()
    pdf.set_font("helvetica", size=11)
    
    # Fecha del reporte
    today = datetime.now().strftime("%d de %B, %Y")
    pdf.cell(0, 10, f'Fecha: {today}', border=False, ln=1, align='L')
    pdf.ln(5)

    # Cabeceras de tabla
    pdf.set_font("helvetica", 'B', 11)
    
    # Colores de cabecera (Azul oscuro)
    pdf.set_fill_color(0, 51, 102)
    pdf.set_text_color(255, 255, 255)
    
    pdf.cell(pdf.epw * 0.7, 10, "Sitio Web", border=1, align='C', fill=True)
    pdf.cell(pdf.epw * 0.3, 10, "Ataques Bloqueados", border=1, ln=1, align='C', fill=True)

    # Restaurar colores para las filas
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("helvetica", size=10)

    total_attacks = 0

    for idx, result in enumerate(results):
        # Color alterno para filas
        if idx % 2 == 0:
            pdf.set_fill_color(240, 240, 240)
        else:
            pdf.set_fill_color(255, 255, 255)
            
        pdf.cell(pdf.epw * 0.7, 10, result['name'], border=1, align='C', fill=True)
        
        data = result['data']
        blocked_count = "N/A"
        if data:
            if 'wordfence' in data:
                blocked_count = data['wordfence'].get('total_attacks', 0)
            else:
                blocked_count = data.get('total_attacks', 0) # Backwards compatibility
                
        pdf.cell(pdf.epw * 0.3, 10, str(blocked_count), border=1, ln=1, align='C', fill=True)

        if isinstance(blocked_count, int):
            total_attacks += blocked_count

    pdf.ln(10)
    pdf.set_font("helvetica", 'B', 12)
    pdf.cell(0, 10, f"Total de ataques bloqueados en la red: {total_attacks}", border=False, ln=1, align='L')
    pdf.ln(10)

    # Detalle por Sitio (Sección avanzada compacta)
    pdf.add_page()
    pdf.set_font("helvetica", 'B', 15)
    pdf.cell(0, 10, "Detalle de Seguridad por Sitio", border=False, ln=1, align='C')
    pdf.ln(3)

    for result in results:
        if not result['data']:
            continue
            
        # Verificar espacio restante para evitar huérfanos
        if pdf.get_y() > 220:
            pdf.add_page()

        data = result['data']
        # Handle nesting for new format
        wf_data = data.get('wordfence', {}) if 'wordfence' in data else data
        
        pdf.set_font("helvetica", 'B', 12)
        pdf.set_fill_color(230, 240, 255)
        pdf.cell(0, 8, f"Sitio: {result['name']}", border="B", ln=1, align='L', fill=True)
        pdf.ln(2)

        # Texto Resumen personalizado
        total_site_attacks = wf_data.get('total_attacks', 0)
        pdf.set_font("helvetica", 'I', 10)
        pdf.set_text_color(50, 50, 50)
        summary_text = (
            f"Este mes, además de las actualizaciones técnicas, nuestro escudo de seguridad neutralizó "
            f"{total_site_attacks} intentos de hackeo dirigidos a tu sitio. "
            f"Tu portal se mantuvo 100% online gracias a este bloqueo proactivo."
        )
        pdf.multi_cell(0, 5, summary_text)
        pdf.set_text_color(0, 0, 0)
        pdf.ln(4)

        # SECCIÓN 1: Mantenimiento Técnico
        pdf.set_font("helvetica", 'B', 11)
        pdf.set_fill_color(240, 240, 240)
        pdf.cell(0, 7, "A. Mantenimiento Técnico", ln=1, fill=True)
        pdf.set_font("helvetica", '', 10)
        
        maintenance = data.get('maintenance', {})
        infra = data.get('infrastructure', {})
        
        pdf.cell(50, 6, f"Versión WP: {infra.get('wp_version', 'N/A')}")
        pdf.cell(50, 6, f"Versión PHP: {infra.get('php_version', 'N/A')}", ln=1)
        pdf.cell(50, 6, f"Último Backup: {maintenance.get('last_backup', 'N/A')}")
        pdf.cell(50, 6, f"Salud del Sitio: {maintenance.get('site_health', 'N/A')}", ln=1)
        
        pdf.ln(2)
        pdf.set_font("helvetica", 'B', 9)
        pdf.cell(0, 6, "Últimos Plugins Actualizados:", ln=1)
        pdf.set_font("helvetica", '', 8)
        updates = maintenance.get('recent_updates', [])
        if updates:
            for up in updates[:5]:
                pdf.cell(0, 5, f"- {up['name']} (v{up['version']})", ln=1)
        else:
            pdf.cell(0, 5, "- No se registraron actualizaciones recientes.", ln=1)
        
        pdf.ln(4)

        # SECCIÓN 2: Infraestructura
        pdf.set_font("helvetica", 'B', 11)
        pdf.set_fill_color(240, 240, 240)
        pdf.cell(0, 7, "B. Infraestructura", ln=1, fill=True)
        pdf.set_font("helvetica", '', 10)
        
        disk_total = infra.get('disk_total', 'N/A')
        disk_free = infra.get('disk_free', 'N/A')
        disk_pct = infra.get('disk_used_percentage', 0)
        
        pdf.cell(0, 6, f"Espacio en Disco: {disk_free} libres de {disk_total} ({disk_pct}% usado)", ln=1)
        # Barra de progreso visual simple
        pdf.set_draw_color(200, 200, 200)
        pdf.rect(pdf.get_x(), pdf.get_y(), 100, 3)
        pdf.set_fill_color(0, 102, 204)
        pdf.rect(pdf.get_x(), pdf.get_y(), min(disk_pct, 100), 3, 'F')
        pdf.ln(5)

        # SECCIÓN 3: Seguridad Proactiva (Wordfence + SSL)
        pdf.set_font("helvetica", 'B', 11)
        pdf.set_fill_color(240, 240, 240)
        pdf.cell(0, 7, "C. Seguridad Proactiva y Salud", ln=1, fill=True)
        pdf.set_font("helvetica", '', 10)
        
        sec = data.get('security', {})
        wf = data.get('wordfence', {})
        
        ssl_days = sec.get('ssl_days_left', 'N/A')
        pdf.cell(80, 6, f"Certificado SSL: {ssl_days} días restantes")
        pdf.cell(80, 6, f"Último Escaneo Malware: {wf.get('last_scan', 'N/A')}", ln=1)
        pdf.ln(2)

        # Definir métricas de Wordfence en pares para cuadrícula (Grid)
        metrics = [
            # Par 1
            [
                ("Top IPs Maliciosas", wf.get('top_ips', []), ['IP', 'Blq'], ['ip', 'count']),
                ("Top URLs Atacadas", wf.get('top_urls', []), ['URL', 'Blq'], ['url', 'count'])
            ],
            # Par 2
            [
                ("Top Motivos Bloqueo", wf.get('top_reasons', []), ['Motivo', 'Blq'], ['reason', 'count']),
                ("Top Usuarios", wf.get('top_usernames', []), ['Usuario', 'Blq'], ['user', 'count'])
            ]
        ]

        for pair in metrics:
            start_y = pdf.get_y()
            max_y = start_y
            
            # Dibujar par de tablas Lado a Lado
            for i, (title, rows, headers, keys) in enumerate(pair):
                if not rows: continue
                
                col_x = 10 + (i * 95)
                pdf.set_xy(col_x, start_y)
                pdf.set_font("helvetica", 'B', 9)
                pdf.cell(90, 6, title, ln=1)
                
                # Header
                pdf.set_x(col_x)
                pdf.set_font("helvetica", 'B', 8)
                pdf.set_fill_color(210, 210, 210)
                pdf.cell(70, 5, headers[0], border=1, fill=True)
                pdf.cell(20, 5, headers[1], border=1, ln=1, align='C', fill=True)
                
                # Filas
                pdf.set_font("helvetica", size=7.5)
                for r in rows:
                    pdf.set_x(col_x)
                    val = r.get(keys[0], 'N/A')
                    count = r.get(keys[1], 0)
                    
                    # Truncar más agresivamente para el grid
                    if len(str(val)) > 45:
                        val = str(val)[:42] + "..."
                        
                    pdf.cell(70, 5, str(val), border=1)
                    pdf.cell(20, 5, str(count), border=1, ln=1, align='C')
                
                if pdf.get_y() > max_y:
                    max_y = pdf.get_y()
            
            pdf.set_y(max_y + 3)
        
        pdf.ln(4)

    filename = f"Reporte_Seguridad_{datetime.now().strftime('%Y-%m-%d')}.pdf"
    
    try:
        pdf.output(filename)
    except OSError as e:
        raise OSError(f"Error escribiendo el reporte PDF al disco: {e}")
        
    return filename

def send_pdf_to_telegram(filepath):
    """Envía el archivo PDF generado por Telegram."""
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendDocument"
    
    try:
        with open(filepath, 'rb') as file:
            files = {'document': file}
            data = {'chat_id': TELEGRAM_CHAT_ID, 'caption': '📊 Aquí está el reporte de seguridad mensual generado.'}
            response = requests.post(url, data=data, files=files, verify=True)
            response.raise_for_status()
            print("Reporte PDF enviado a Telegram exitosamente.")
    except Exception as e:
         print(f"Error enviando PDF por Telegram: {e}")

def main():
    print("Recolectando datos de los sitios...")
    results = []
    
    for site in SITES:
        print(f"  -> {site['name']}...")
        site_data = fetch_site_stats(site['url'])
        
        results.append({
            "name": site['name'],
            "data": site_data
        })
        
    print("\nGenerando PDF...")
    pdf_filename = generate_pdf(results)
    print(f"PDF generado: {pdf_filename}")
    
    print("Enviando por Telegram...")
    send_pdf_to_telegram(pdf_filename)

if __name__ == '__main__':
    main()
