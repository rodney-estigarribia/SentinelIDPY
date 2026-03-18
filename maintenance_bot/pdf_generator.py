import datetime
import os
import logging
from fpdf import FPDF
from PIL import Image

logger = logging.getLogger(__name__)

class PDFGenerator:
    def __init__(self, cliente_nombre, improved_text, antes_img=None, despues_img=None):
        self.pdf = FPDF()
        # Try to use Montserrat, fallback to Helvetica
        font_path = "Montserrat.ttf"
        if os.path.exists(font_path):
            try:
                self.pdf.add_font("Montserrat", "", font_path)
                self.pdf.add_font("Montserrat", "B", font_path)
                self.font_family = "Montserrat"
            except Exception as e:
                logger.warning(f"Could not load Montserrat: {e}, using Helvetica")
                self.font_family = "Helvetica"
        else:
            self.font_family = "Helvetica"

        self.cliente_nombre = cliente_nombre
        self.improved_text = improved_text
        self.antes_path = antes_img
        self.despues_path = despues_img
        
        # Estilo Premium Colores
        self.AZUL_NAVY = (26, 35, 126)   # #1A237E
        self.GRIS_HEAD = (245, 245, 245) # #F5F5F5
        self.GRIS_TEXT = (100, 100, 100)
    
    def _header(self):
        self.pdf.set_fill_color(*self.AZUL_NAVY)
        self.pdf.rect(0, 0, 210, 40, 'F')

        self.pdf.set_font(self.font_family, 'B', 18)
        self.pdf.set_text_color(255, 255, 255)
        self.pdf.set_xy(10, 15)
        self.pdf.cell(0, 10, f"Reporte de Mantenimiento: {self.cliente_nombre}", 0, 1, 'L')

        # Position cursor below header for content
        self.pdf.set_y(45)
    
    def _footer(self):
        self.pdf.set_y(-15)
        self.pdf.set_font(self.font_family, '' , 8)
        self.pdf.set_text_color(*self.GRIS_TEXT)
        fecha = datetime.datetime.now().strftime("%d/%m/%Y")
        self.pdf.cell(0, 10, f'Generado el {fecha} | SentinelIDPY Maintenance System', 0, 0, 'C')

    def _add_security_uptime(self):
        self.pdf.set_font(self.font_family, 'B', 12)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self.pdf.cell(0, 10, "Resumen de Infraestructura", 0, 1, 'L')
        
        self.pdf.set_fill_color(*self.GRIS_HEAD)
        self.pdf.set_font(self.font_family, '', 10)
        self.pdf.set_text_color(0, 0, 0)
        
        y_ini = self.pdf.get_y()
        self.pdf.rect(10, y_ini, 90, 20, 'F')
        self.pdf.set_xy(15, y_ini+5)
        self.pdf.set_font(self.font_family, '', 10)
        self.pdf.cell(80, 5, "Escudo de Seguridad", 0, 1, 'C')
        self.pdf.set_x(15)
        self.pdf.set_font(self.font_family, 'B', 11)
        self.pdf.cell(80, 5, "Wordfence Activo", 0, 0, 'C')

        self.pdf.set_xy(110, y_ini)
        self.pdf.rect(110, y_ini, 90, 20, 'F')
        self.pdf.set_xy(115, y_ini+5)
        self.pdf.set_font(self.font_family, '', 10)
        self.pdf.cell(80, 5, "Disponibilidad", 0, 1, 'C')
        self.pdf.set_x(115)
        self.pdf.set_font(self.font_family, 'B', 11)
        self.pdf.cell(80, 5, "100% Operativo", 0, 1, 'C')
        self.pdf.ln(10)

    def _add_manual_tasks(self):
        self.pdf.ln(5)
        self.pdf.set_font(self.font_family, 'B', 14)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self.pdf.cell(0, 10, "Optimizacion Proactiva", 0, 1, 'L')

        self.pdf.set_font(self.font_family, '', 11)
        self.pdf.set_text_color(20, 20, 20)
        self.pdf.set_fill_color(*self.GRIS_HEAD)
        # Add border to highlight the section with star indicator
        self.pdf.multi_cell(0, 8, f"{self.improved_text}", border=1, align='J', fill=True)
        self.pdf.ln(10)

    def _add_visual_evidence(self):
        if not self.antes_path and not self.despues_path:
            return

        self.pdf.ln(5)
        self.pdf.set_font(self.font_family, 'B', 12)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self.pdf.cell(0, 10, "Evidencia Visual del Mantenimiento", 0, 1, 'L')
        
        img_w = 90
        x1, x2 = 10, 110
        y_pos = self.pdf.get_y()

        def process_img(path):
            try:
                img = Image.open(path)
                # Resize para evitar OOM / PDFs pesados
                img.thumbnail((1024, 1024))
                webp_path = path.rsplit('.', 1)[0] + f"_{datetime.datetime.now().microsecond}.webp"
                img.save(webp_path, "WEBP", quality=80)
                return webp_path
            except Exception as e:
                logger.error(f"Error procesando imagen {path}: {e}")
                return None

        for idx, (path, x_pos, label) in enumerate([(self.antes_path, x1, "ANTES"), (self.despues_path, x2, "DESPUES")]):
            if path and os.path.exists(path):
                wp = process_img(path)
                if wp:
                    self.pdf.image(wp, x=x_pos, y=y_pos+5, w=img_w)
                    self.pdf.set_xy(x_pos, y_pos+img_w/1.5 + 8)
                    self.pdf.set_font(self.font_family, 'B', 9)
                    self.pdf.cell(img_w, 5, label, 0, 0, 'C')
        
        self.pdf.ln(10)

    def generate(self, filename):
        self.pdf.add_page()
        self._header()
        self._add_security_uptime()
        self._add_manual_tasks()
        self._add_visual_evidence()
        self._footer()
        
        if not os.path.exists("reportes"):
            os.makedirs("reportes")
            
        save_path = os.path.join("reportes", filename)
        self.pdf.output(save_path)
        return save_path

if __name__ == "__main__":
    # Generador de prueba
    gen = PDFGenerator("CGA", "Hemos optimizado el tiempo de respuesta del servidor reduciendo el consumo de memoria en un 25%, asegurando una carga fluida.")
    gen.generate("test.pdf")
    print("Reporte generado con éxito.")
