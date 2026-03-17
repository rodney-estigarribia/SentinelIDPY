import os
import requests
from fpdf import FPDF
from datetime import datetime

# Constantes de Entorno
TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")
WF_REPORT_TOKEN = os.environ.get("WF_REPORT_TOKEN")

if not all([TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, WF_REPORT_TOKEN]):
    raise ValueError("Faltan variables de entorno críticas (TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, o WF_REPORT_TOKEN). Operación abortada.")

# Lista de tus sitios (Asegúrate de que tengan el plugin/snippet instalado)
SITES = [
    {"name": "CGA", "url": "https://cga.com.py"},
    {"name": "Cope Market Deli", "url": "https://copemarketdeli.com.py"},
    {"name": "Dagda", "url": "https://dagda.com.py"},
    {"name": "GeneSur", "url": "https://genesur.com.py"},
    {"name": "Navíos Argentina", "url": "https://naviosargentina.com"},
    {"name": "Synexa", "url": "https://synexa.com.py"},
]

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

class PDFReport(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 15)
        # Arial bold 15
        self.cell(0, 10, 'Reporte de Mantenimiento y Seguridad (Últimos 30 Días)', border=False, ln=1, align='C')
        self.ln(10)

def fetch_wordfence_stats(url):
    """Consulta el endpoint de Wordfence de un sitio."""
    endpoint = f"{url}/wp-json/custom-reports/v1/wordfence-blocks"
    headers = {
        'User-Agent': USER_AGENT,
        'X-WF-Report-Token': WF_REPORT_TOKEN
    }
    try:
        response = requests.get(endpoint, headers=headers, timeout=15, verify=True)
        response.raise_for_status()
        data = response.json()
        return data.get('blocked_attacks', 0)
    except requests.exceptions.RequestException as e:
        print(f"Error consultando {url}: {e}")
        return "N/A" # No disponible

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
    col_width = pdf.epw / 3
    pdf.set_font("helvetica", 'B', 11)
    
    # Colores de cabecera (Azul oscuro)
    pdf.set_fill_color(0, 51, 102)
    pdf.set_text_color(255, 255, 255)
    
    pdf.cell(col_width, 10, "Sitio Web", border=1, align='C', fill=True)
    pdf.cell(col_width, 10, "Actualizaciones (v2 dev)", border=1, align='C', fill=True)
    pdf.cell(col_width, 10, "Ataques Bloqueados", border=1, ln=1, align='C', fill=True)

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
            
        pdf.cell(col_width, 10, result['name'], border=1, align='C', fill=True)
        pdf.cell(col_width, 10, result['updates'], border=1, align='C', fill=True)
        pdf.cell(col_width, 10, str(result['blocked']), border=1, ln=1, align='C', fill=True)

        if isinstance(result['blocked'], int):
            total_attacks += result['blocked']

    pdf.ln(10)
    pdf.set_font("helvetica", 'B', 12)
    pdf.cell(0, 10, f"Total de ataques bloqueados en la red: {total_attacks}", border=False, ln=1, align='L')

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
        attacks = fetch_wordfence_stats(site['url'])
        
        # Placeholder manual para updates en esta versión v2
        updates_text = "Core, Plugins & Theme"
        
        results.append({
            "name": site['name'],
            "updates": updates_text,
            "blocked": attacks
        })
        
    print("\nGenerando PDF...")
    pdf_filename = generate_pdf(results)
    print(f"PDF generado: {pdf_filename}")
    
    print("Enviando por Telegram...")
    send_pdf_to_telegram(pdf_filename)

if __name__ == '__main__':
    main()
