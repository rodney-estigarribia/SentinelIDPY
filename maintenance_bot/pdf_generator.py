import datetime
import os
import logging
from fpdf import FPDF
from PIL import Image

logger = logging.getLogger(__name__)

MESES = {
    1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
    5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
    9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
}


class PDFGenerator:
    def __init__(self, cliente_nombre, improved_text, antes_img=None, despues_img=None,
                 infra_data=None, ssl_days=None, hoja_de_ruta=None, metrics_data=None,
                 wordfence_data=None, maintenance_data=None, recommendations=None, timeframe_name="Últimos 30 días"):
        self.pdf = FPDF()
        self.has_emoji_font = False

        # Try to use Montserrat, fallback to Helvetica
        font_path = "Montserrat.ttf"
        if os.path.exists(font_path):
            try:
                self.pdf.add_font("Montserrat", "", font_path)
                self.pdf.add_font("Montserrat", "B", font_path)
                self.font_family = "Montserrat"
            except Exception as e:
                logger.warning(
                    f"Could not load Montserrat: {e}, using Helvetica")
                self.font_family = "Helvetica"
        else:
            self.font_family = "Helvetica"

        # Try to load Noto Emoji font for emoji support
        emoji_paths = [
            os.path.join(os.path.dirname(__file__), "NotoEmoji-Variable.ttf"),
            "NotoEmoji-Variable.ttf",
            "maintenance_bot/NotoEmoji-Variable.ttf",
        ]
        for epath in emoji_paths:
            if os.path.exists(epath):
                try:
                    self.pdf.add_font("NotoEmoji", "", epath)
                    self.has_emoji_font = True
                    logger.info(f"Loaded NotoEmoji font from {epath}")
                    break
                except Exception as e:
                    logger.warning(f"Could not load NotoEmoji {epath}: {e}")
                    continue

        self.cliente_nombre = cliente_nombre
        self.improved_text = improved_text
        self.antes_path = antes_img
        self.despues_path = despues_img
        self.infra_data = infra_data or {}
        self.ssl_days = ssl_days
        self.hoja_de_ruta = hoja_de_ruta
        self.metrics_data = metrics_data or {}
        self.wordfence_data = wordfence_data or {}
        self.maintenance_data = maintenance_data or {}
        self.recommendations = recommendations or []
        self.timeframe_name = timeframe_name

        # Colores
        self.AZUL_NAVY = (26, 35, 126)   # #1A237E
        self.GRIS_HEAD = (245, 245, 245)  # F5F5F5
        self.GRIS_TEXT = (100, 100, 100)
        self.ROJO_ALERTA = (220, 53, 69)  # #DC3545
        self.VERDE_OK = (40, 167, 69)     # #28A745
        self.AMARILLO_WARN = (255, 193, 7)  # FFC107

    def _section_title(self, emoji, text, size=12, h=8, align='L', fill=False, w=0):
        """Render a section title with emoji (using NotoEmoji) then text in main font."""
        if self.has_emoji_font:
            # Render emoji with NotoEmoji font
            self.pdf.set_font("NotoEmoji", "", size)
            emoji_w = self.pdf.get_string_width(emoji) + 2
            self.pdf.cell(emoji_w, h, emoji, 0, 0, 'L', fill)
            # Render text with main font
            self.pdf.set_font(self.font_family, 'B', size)
            remaining_w = (w - emoji_w) if w > 0 else 0
            self.pdf.cell(remaining_w, h, text, 0, 1, align, fill)
        else:
            self.pdf.cell(w, h, text, 0, 1, align, fill)

    # Card layout constants
    CARD_X_START = 10
    CARD_W_WITH_METRICS = 36
    CARD_W_WITHOUT_METRICS = 45
    CARD_GAP_WITH_METRICS = 2.0
    CARD_GAP_WITHOUT_METRICS = 2.5
    CARD_VAL_SIZE_WITH_METRICS = 11
    CARD_VAL_SIZE_WITHOUT_METRICS = 12
    MINI_BAR_HEIGHT = 3
    DETAIL_BAR_HEIGHT = 5
    TABLE_COL_NAME_W = 140  # Wide column: plugin name, URL
    TABLE_COL_VAL_W = 50    # Narrow column: version, count
    # Half-width column: IP address + count (security table)
    TABLE_COL_IP_W = 95

    # ─── PAGE 1: EXECUTIVE DASHBOARD ───────────────────────────────

    def _header_premium(self):
        """Encabezado con logo, nombre del cliente y mes/año."""
        self.pdf.set_fill_color(*self.AZUL_NAVY)
        self.pdf.rect(0, 0, 210, 40, 'F')

        # Espacio reservado para logo (izquierda)
        logo_path = "logo.png"
        logo_w = 30
        if os.path.exists(logo_path):
            self.pdf.image(logo_path, x=10, y=5, w=logo_w)
        text_x = 10 + logo_w + 5 if os.path.exists(logo_path) else 10

        self.pdf.set_font(self.font_family, 'B', 18)
        self.pdf.set_text_color(255, 255, 255)
        self.pdf.set_xy(text_x, 10)
        self._section_title(
            "📊", f"DASHBOARD ESTRATÉGICO - {self.cliente_nombre}", size=18, h=10)

        # Subtitulo con periodo y preparado por
        self.pdf.set_font(self.font_family, '', 10)
        self.pdf.set_text_color(200, 200, 220)
        self.pdf.set_x(text_x)
        period_str = getattr(self, 'timeframe_name', 'Últimos 30 días')
        self.pdf.cell(
            0, 8, f"Período: {period_str} | Preparado por: Rodney Mendoza - Impulsos Digitales", 0, 1, 'L')

        self.pdf.set_y(48)

    def _draw_operational_health(self):
        """Sección SALUD OPERATIVA con 6 cards en grid de 3 columnas."""
        self.pdf.set_font(self.font_family, 'B', 12)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self._section_title("🏥", "SALUD OPERATIVA")
        self.pdf.ln(2)

        y_ini = self.pdf.get_y()
        x_start = 10
        card_w = 60
        gap_x = 5
        gap_y = 5
        card_h = 28

        active_shields = str(self.wordfence_data.get('active_shields', 6))

        attacks = self.wordfence_data.get('total_attacks', 0)
        if attacks >= 1000000:
            security_text = f"{attacks/1000000:.1f}M"
        elif attacks >= 1000:
            security_text = f"{attacks/1000:.1f}k"
        else:
            security_text = str(attacks)
        security_label = "Intentos de ataque" if attacks == 0 else "Ataques bloqueados"
        security_color = self.VERDE_OK if attacks == 0 else self.ROJO_ALERTA

        ssl_days = self.ssl_days if self.ssl_days is not None else 0
        ssl_color = self.ROJO_ALERTA if ssl_days <= 0 else (
            self.AMARILLO_WARN if ssl_days < 15 else self.VERDE_OK)
        if ssl_days <= 0:
            ssl_value = "0 dias"
            ssl_label = "Certificado expirado"
            ssl_footnote = None
        else:
            ssl_value = f"{ssl_days} dias"
            ssl_label = "Renovacion automatica"
            ssl_footnote = "* Renovacion automatica habilitada"

        pending = self.maintenance_data.get('pending_updates', {})
        total_pending = pending.get(
            'plugins', 0) + pending.get('themes', 0) + pending.get('wordpress', 0)
        updates_value = "0" if total_pending == 0 else str(total_pending)
        updates_label = "Actualiz. pendientes"
        updates_color = self.VERDE_OK if total_pending == 0 else self.AMARILLO_WARN

        cards = [
            ("100%", "Tiempo en linea", self.VERDE_OK, None),
            (security_text, security_label, security_color, None),
            (active_shields, "Escudos activos", self.AZUL_NAVY, None),
            (ssl_value, ssl_label, ssl_color, ssl_footnote),
            (updates_value, updates_label, updates_color, None),
            ("1 x dia", "Respaldos remotos", self.AZUL_NAVY, None)
        ]

        for i, card in enumerate(cards):
            row = i // 3
            col = i % 3
            x = x_start + col * (card_w + gap_x)
            y = y_ini + row * (card_h + gap_y)
            self._draw_health_card(x, y, card_w, card_h,
                                   card[0], card[1], card[2], footnote=card[3])

        self.pdf.set_y(y_ini + 2 * card_h + gap_y + 3)
        self.pdf.set_text_color(0, 0, 0)

    def _draw_health_card(self, x, y, w, h, big_value, label, color, footnote=None):
        """Dibuja una tarjeta de salud con valor grande arriba y etiqueta abajo."""
        # Fondo
        self.pdf.set_fill_color(*self.GRIS_HEAD)
        self.pdf.rect(x, y, w, h, 'F')
        # Barra de color arriba
        self.pdf.set_fill_color(*color)
        self.pdf.rect(x, y, w, 3, 'F')

        # Valor grande (arriba)
        self.pdf.set_xy(x, y + 5)
        val_size = 16
        if len(big_value) >= 6:
            val_size = 13
        elif len(big_value) >= 4:
            val_size = 14
        self.pdf.set_font(self.font_family, 'B', val_size)
        self.pdf.set_text_color(*color)
        self.pdf.cell(w, 8, big_value, 0, 1, 'C')

        # Etiqueta (abajo)
        self.pdf.set_xy(x + 1, y + 14)
        label_size = 8
        if len(label) > 20 and "\n" not in label:
            label_size = 7
        self.pdf.set_font(self.font_family, '', label_size)
        self.pdf.set_text_color(30, 30, 30)
        self.pdf.multi_cell(w - 2, 3.5, label, border=0, align='C')

        if footnote:
            # We add footnote 0.5 units below the current cursor which was moved by multi_cell
            self.pdf.set_y(self.pdf.get_y() + 0.5)
            self.pdf.set_font(self.font_family, '', 6)
            self.pdf.set_text_color(130, 130, 130)
            self.pdf.set_x(x + 1)
            self.pdf.multi_cell(w - 2, 2.5, footnote, border=0, align='C')

    def _draw_metric_card(self, x, y, w, h, big_value, label, color, trend=None):
        """Dibuja una tarjeta de metrica con valor grande arriba, etiqueta abajo, y trend opcional."""
        # Fondo
        self.pdf.set_fill_color(*self.GRIS_HEAD)
        self.pdf.rect(x, y, w, h, 'F')
        # Barra de color arriba
        self.pdf.set_fill_color(*color)
        self.pdf.rect(x, y, w, 3, 'F')

        # Valor grande (arriba)
        self.pdf.set_xy(x, y + 4)
        self.pdf.set_font(self.font_family, 'B', 14)
        self.pdf.set_text_color(*color)
        self.pdf.cell(w, 7, big_value, 0, 1, 'C')

        # Etiqueta (medio)
        self.pdf.set_xy(x, y + 12)
        self.pdf.set_font(self.font_family, '', 8)
        self.pdf.set_text_color(30, 30, 30)
        self.pdf.multi_cell(w - 2, 3, label, border=0, align='C')

        # Trend (abajo, si existe)
        if trend is not None:
            trend_text = f"+{trend:.0f}%" if trend >= 0 else f"{trend:.0f}%"
            trend_color = self.VERDE_OK if trend >= 0 else self.ROJO_ALERTA
            self.pdf.set_xy(x, y + h - 6)
            self.pdf.set_font(self.font_family, 'B', 7)
            self.pdf.set_text_color(*trend_color)
            self.pdf.cell(w, 4, trend_text, 0, 0, 'C')

    def _draw_business_impact(self):
        """Sección MÉTRICAS DE IMPACTO con datos de Matomo si están disponibles."""
        self.pdf.ln(3)
        self.pdf.set_font(self.font_family, 'B', 12)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self._section_title("📈", "MÉTRICAS DE IMPACTO")
        self.pdf.ln(2)

        if not self.metrics_data:
            self.pdf.set_font(self.font_family, '', 10)
            self.pdf.set_text_color(*self.GRIS_TEXT)
            self.pdf.set_fill_color(*self.GRIS_HEAD)
            self.pdf.multi_cell(
                0, 6, "Pronto tendremos mas informacion sobre las metricas de tu web.", border=1, align='C', fill=True)
            self.pdf.ln(3)
            return

        y_ini = self.pdf.get_y()
        x_start = 10
        card_w = 44
        gap = 1
        card_h = 32  # taller to fit trend line

        # Calculate trends from previous month
        prev = self.metrics_data.get('prev_month', {})

        def calc_trend(current, prev_val):
            if prev_val and prev_val > 0:
                return ((current - prev_val) / prev_val) * 100
            return None

        # Card 1: Visitantes únicos
        x = x_start
        visitors = self.metrics_data.get('nb_uniq_visitors', 0)
        trend_visitors = calc_trend(visitors, prev.get('nb_uniq_visitors'))
        self._draw_metric_card(
            x, y_ini, card_w, card_h, f"{visitors:,}", "Visitantes\nunicos", self.AZUL_NAVY, trend=trend_visitors)

        # Card 2: Páginas por visita
        x = x_start + (card_w + gap)
        pages_per_visit = self.metrics_data.get('nb_actions_per_visit', 0)
        trend_ppv = calc_trend(
            pages_per_visit, prev.get('nb_actions_per_visit'))
        self._draw_metric_card(
            x, y_ini, card_w, card_h, f"{pages_per_visit:.1f}", "Paginas por\nvisita", self.AZUL_NAVY, trend=trend_ppv)

        # Card 3: Tiempo promedio
        x = x_start + 2 * (card_w + gap)
        avg_time_val = self.metrics_data.get('avg_time_on_site', 0)
        avg_time = self._format_duration(avg_time_val)
        trend_time = calc_trend(avg_time_val, prev.get('avg_time_on_site'))
        self._draw_metric_card(x, y_ini, card_w, card_h, avg_time,
                               "Tiempo\npromedio", self.AZUL_NAVY, trend=trend_time)

        # Card 4: Tasa de rebote (inverted: lower is better)
        x = x_start + 3 * (card_w + gap)
        bounce_rate = self.metrics_data.get('bounce_rate', 0)
        bounce_color = self.ROJO_ALERTA if bounce_rate > 35 else self.VERDE_OK
        trend_bounce = calc_trend(bounce_rate, prev.get('bounce_rate'))
        # For bounce rate, invert the trend color (increase = bad)
        if trend_bounce is not None:
            trend_bounce = -trend_bounce  # flip sign so decrease shows as positive
        self._draw_metric_card(
            x, y_ini, card_w, card_h, f"{bounce_rate:.1f}%", "Tasa de\nrebote", bounce_color, trend=trend_bounce)

        self.pdf.set_y(y_ini + card_h + 3)
        self.pdf.set_text_color(0, 0, 0)

    def _draw_device_breakdown(self):
        """Sección COMPORTAMIENTO POR DISPOSITIVO: Desktop vs Mobile."""
        devices = self.metrics_data.get(
            'devices', []) if self.metrics_data else []
        if not devices:
            return

        self.pdf.ln(3)
        self.pdf.set_font(self.font_family, 'B', 12)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self._section_title("📱", "COMPORTAMIENTO POR DISPOSITIVO")
        self.pdf.ln(2)

        y_ini = self.pdf.get_y()
        x_start = 10
        card_w = 92
        gap = 6
        card_h = 24

        # Total visits for percentage calculation
        total_visits = sum(d.get('nb_visits', 0) for d in devices)

        # Group into Desktop and Mobile (merge Tablet into Desktop)
        desktop = {'nb_visits': 0, 'bounce_rate': 0, 'count': 0}
        mobile = {'nb_visits': 0, 'bounce_rate': 0, 'count': 0}
        for dev in devices:
            label = dev.get('label', '').lower()
            if 'mobile' in label or 'smart' in label or 'phone' in label:
                mobile['nb_visits'] += dev.get('nb_visits', 0)
                mobile['bounce_rate'] += dev.get('bounce_rate', 0)
                mobile['count'] += 1
            else:
                desktop['nb_visits'] += dev.get('nb_visits', 0)
                desktop['bounce_rate'] += dev.get('bounce_rate', 0)
                desktop['count'] += 1

        desktop_bounce = desktop['bounce_rate'] / max(desktop['count'], 1)
        mobile_bounce = mobile['bounce_rate'] / max(mobile['count'], 1)

        for i, (label, data, bounce) in enumerate([
            ("Desktop", desktop, desktop_bounce),
            ("Mobile", mobile, mobile_bounce),
        ]):
            x = x_start + i * (card_w + gap)
            pct = (data['nb_visits'] / total_visits *
                   100) if total_visits > 0 else 0
            bounce_color = self.VERDE_OK if bounce < 40 else (
                self.AMARILLO_WARN if bounce < 50 else self.ROJO_ALERTA)

            # Card background
            self.pdf.set_fill_color(*self.GRIS_HEAD)
            self.pdf.rect(x, y_ini, card_w, card_h, 'F')
            self.pdf.set_fill_color(*bounce_color)
            self.pdf.rect(x, y_ini, card_w, 3, 'F')

            # Content
            self.pdf.set_xy(x + 3, y_ini + 5)
            self.pdf.set_font(self.font_family, 'B', 10)
            self.pdf.set_text_color(*self.AZUL_NAVY)
            self.pdf.cell(
                card_w - 6, 5, f"{label}: {data['nb_visits']:,} ({pct:.0f}%)", 0, 1, 'L')

            self.pdf.set_xy(x + 3, y_ini + 12)
            self.pdf.set_font(self.font_family, '', 9)
            self.pdf.set_text_color(*bounce_color)
            bounce_label = "ALTO" if bounce >= 50 else (
                "medio" if bounce >= 40 else "bajo")
            self.pdf.cell(
                card_w - 6, 5, f"Rebote: {bounce:.1f}% ({bounce_label})", 0, 0, 'L')

        self.pdf.set_y(y_ini + card_h + 3)
        self.pdf.set_text_color(0, 0, 0)

    def _draw_conversions(self):
        """Sección CONVERSIONES: Solo si hay metas de Matomo configuradas."""
        conversions = self.metrics_data.get(
            'conversions') if self.metrics_data else None
        if conversions is None:
            return

        self.pdf.ln(3)
        self.pdf.set_font(self.font_family, 'B', 12)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self._section_title("💰", "CONVERSIONES")
        self.pdf.ln(2)

        y_ini = self.pdf.get_y()
        x_start = 10
        card_w = 92
        gap = 6
        card_h = 28

        # Card 1: Leads/Conversiones
        x = x_start
        nb_conv = conversions.get('nb_conversions', 0)
        self._draw_metric_card(x, y_ini, card_w, card_h,
                               f"{nb_conv:,}", "Conversiones", self.AZUL_NAVY)

        # Card 2: Tasa de conversion
        x = x_start + (card_w + gap)
        cr_raw = conversions.get('conversion_rate', '0%')
        if isinstance(cr_raw, str):
            cr = float(cr_raw.replace('%', '').strip() or 0)
        else:
            cr = float(cr_raw)
        cr_color = self.VERDE_OK if cr >= 3 else self.ROJO_ALERTA
        self._draw_metric_card(x, y_ini, card_w, card_h,
                               f"{cr:.1f}%", "Tasa de\nconversion", cr_color)

        self.pdf.set_y(y_ini + card_h + 3)
        self.pdf.set_text_color(0, 0, 0)

    def _draw_hoja_de_ruta(self):
        """Sección HOJA DE RUTA con pasos estructurados con ROI."""
        if not self.hoja_de_ruta:
            return

        self.pdf.ln(3)

        # Titulo principal en ALL CAPS
        self.pdf.set_font(self.font_family, 'B', 12)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self._section_title("🎯", "LOS SIGUIENTES PASOS", size=12, h=6)

        # Subtitulo
        self.pdf.set_font(self.font_family, '', 10)
        self.pdf.set_text_color(30, 30, 30)
        self.pdf.cell(
            0, 5, "Para llevar tu web al siguiente nivel son:", 0, 1, 'L')
        self.pdf.ln(2)

        # Structured sub-line labels for color coding
        structured_labels = {
            'Problema:': self.ROJO_ALERTA,
            'Accion:': self.AZUL_NAVY,
            'Inversion:': (133, 100, 0),
            'Retorno:': self.VERDE_OK,
        }

        # Parse roadmap text into steps
        lines = self.hoja_de_ruta.strip().split('\n')
        steps = []
        current_step = None
        for line in lines:
            stripped = line.strip()
            if stripped.startswith('•') or (stripped.startswith('-') and not stripped.startswith('  ')):
                if current_step:
                    steps.append(current_step)
                current_step = {'title': stripped.lstrip(
                    '•- ').strip(), 'details': []}
            elif stripped and current_step:
                # Check if it's a structured sub-line
                current_step['details'].append(stripped)
        if current_step:
            steps.append(current_step)

        steps = steps[:3]

        for i, step in enumerate(steps):
            # Step header
            self.pdf.set_font(self.font_family, 'B', 10)
            self.pdf.set_text_color(*self.AZUL_NAVY)
            self.pdf.cell(0, 5, f"Paso {i+1}: {step['title']}", 0, 1, 'L')

            # Step details
            for detail in step['details']:
                detail_stripped = detail.strip()
                # Check for structured label
                label_found = False
                for label, color in structured_labels.items():
                    if detail_stripped.startswith(label):
                        # Render label in color, value in dark
                        self.pdf.set_x(18)
                        self.pdf.set_font(self.font_family, 'B', 8)
                        self.pdf.set_text_color(*color)
                        label_w = self.pdf.get_string_width(label) + 2
                        self.pdf.cell(label_w, 3.5, label, 0, 0, 'L')
                        self.pdf.set_font(self.font_family, '', 8)
                        self.pdf.set_text_color(30, 30, 30)
                        value = detail_stripped[len(label):].strip()
                        self.pdf.multi_cell(
                            155, 3.5, value, border=0, align='L')
                        label_found = True
                        break

                if not label_found:
                    # Regular detail line
                    self.pdf.set_font(self.font_family, '', 8)
                    self.pdf.set_text_color(30, 30, 30)
                    self.pdf.set_x(18)
                    self.pdf.multi_cell(
                        172, 3.5, detail_stripped, border=0, align='L')

            self.pdf.ln(2)

        self.pdf.ln(1)

    def _draw_financial_summary(self):
        """Sección RESUMEN FINANCIERO con totales de inversión y retorno."""
        if not self.recommendations:
            return

        from recommendation_engine import RecommendationEngine
        summary = RecommendationEngine.financial_summary(self.recommendations)
        if not summary or summary['total_monthly_return'] == 0:
            return

        self.pdf.ln(3)

        # Titulo
        self.pdf.set_font(self.font_family, 'B', 11)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self._section_title("💰", "RESUMEN FINANCIERO DEL PLAN", size=11, h=6)
        self.pdf.ln(1)

        box_x = 10
        box_w = 190

        # Fondo gris claro
        self.pdf.set_fill_color(*self.GRIS_HEAD)

        # INVERSIÓN
        self.pdf.set_font(self.font_family, 'B', 9)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self.pdf.set_x(box_x + 3)
        self.pdf.cell(box_w - 3, 5, "INVERSION TOTAL:", 0, 1, 'L', fill=True)

        self.pdf.set_font(self.font_family, '', 8)
        self.pdf.set_text_color(30, 30, 30)
        for item in summary['items']:
            if item['investment'] > 0:
                self.pdf.set_x(box_x + 8)
                self.pdf.cell(
                    box_w - 8, 3.5, f"{item['action']}:  Gs. {item['investment']:,}", 0, 1, 'L', fill=True)

        self.pdf.set_font(self.font_family, 'B', 9)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self.pdf.set_x(box_x + 8)
        self.pdf.cell(
            box_w - 11, 5, f"TOTAL INVERSIÓN:  Gs. {summary['total_investment']:,}", 0, 1, 'R', fill=True)

        # RETORNO
        self.pdf.set_font(self.font_family, 'B', 9)
        self.pdf.set_text_color(*self.VERDE_OK)
        self.pdf.set_x(box_x + 3)
        self.pdf.cell(box_w - 3, 5, "RETORNO MENSUAL ESTIMADO:",
                      0, 1, 'L', fill=True)

        self.pdf.set_font(self.font_family, '', 8)
        self.pdf.set_text_color(30, 30, 30)
        for item in summary['items']:
            if item['monthly_return'] > 0:
                self.pdf.set_x(box_x + 8)
                self.pdf.cell(
                    box_w - 8, 3.5, f"{item['action']}:  Gs. {item['monthly_return']:,}/mes", 0, 1, 'L', fill=True)

        self.pdf.set_font(self.font_family, 'B', 9)
        self.pdf.set_text_color(*self.VERDE_OK)
        self.pdf.set_x(box_x + 8)
        self.pdf.cell(
            box_w - 11, 5, f"RETORNO MENSUAL TOTAL:  Gs. {summary['total_monthly_return']:,}", 0, 1, 'R', fill=True)

        # Payback + ROI
        self.pdf.set_font(self.font_family, 'B', 8)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self.pdf.set_x(box_x + 3)
        payback = summary['payback_months']
        payback_text = f"~{payback:.0f} mes" if payback <= 1.5 else f"~{payback:.0f} meses"
        roi_3m_pct = int((summary['roi_3_months'] / summary['total_investment'])
                         * 100) if summary['total_investment'] > 0 else 0
        self.pdf.cell(box_w - 3, 4,
                      f"Recuperacion: {payback_text}  |  ROI a 3 meses: Gs. {summary['roi_3_months']:,} ({roi_3m_pct}%)",
                      0, 1, 'L', fill=True)

        self.pdf.set_y(self.pdf.get_y() + 2)
        self.pdf.set_text_color(0, 0, 0)

    def _draw_cta_section(self):
        """Sección PROXIMO PASO con CTA claro, precio y urgencia."""
        self.pdf.ln(3)

        y_ini = self.pdf.get_y()
        box_x = 10
        box_w = 190
        self.pdf.set_fill_color(237, 242, 251)

        # Titulo
        self.pdf.set_font(self.font_family, 'B', 11)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self.pdf.set_x(box_x)
        self._section_title(
            "✅", "PROXIMO PASO - AUDITORIA ESTRATEGICA", size=11, h=7, fill=True, w=box_w)

        # INMEDIATO
        self.pdf.set_font(self.font_family, 'B', 9)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self.pdf.set_x(box_x + 5)
        self.pdf.cell(box_w - 5, 5, "INMEDIATO (Esta semana):",
                      0, 1, 'L', fill=True)

        self.pdf.set_font(self.font_family, '', 8)
        self.pdf.set_text_color(30, 30, 30)
        self.pdf.set_x(box_x + 10)
        self.pdf.cell(
            box_w - 10, 4, "Agendar auditoria estrategica con Rodney", 0, 1, 'L', fill=True)
        self.pdf.set_x(box_x + 10)
        self.pdf.cell(
            box_w - 10, 4, "Tiempo: 2-3 horas de analisis  |  Costo: Gs. 1.500.000 (plan completo)", 0, 1, 'L', fill=True)

        # Contacto
        self.pdf.set_font(self.font_family, 'B', 8)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self.pdf.set_x(box_x + 10)
        self.pdf.cell(
            box_w - 10, 4, "WhatsApp: +595 981 123456  |  Email: rodney@impulsosdigitales.com", 0, 1, 'L', fill=True)
        self.pdf.set_x(box_x + 10)
        self.pdf.cell(
            box_w - 10, 4, "Calendario: https://calendly.com/impulsosdigitales", 0, 1, 'L', fill=True)

        # Urgencia
        self.pdf.set_font(self.font_family, 'B', 8)
        self.pdf.set_text_color(*self.ROJO_ALERTA)
        self.pdf.set_x(box_x + 10)
        self.pdf.cell(
            box_w - 10, 4, "IMPORTANTE: Las mejoras en mobile impactan directamente tus ingresos.", 0, 1, 'L', fill=True)

        # CORTO PLAZO
        self.pdf.set_font(self.font_family, 'B', 9)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self.pdf.set_x(box_x + 5)
        self.pdf.cell(
            box_w - 5, 5, "CORTO PLAZO (Proximas 2 semanas):", 0, 1, 'L', fill=True)

        self.pdf.set_font(self.font_family, '', 8)
        self.pdf.set_text_color(30, 30, 30)
        self.pdf.set_x(box_x + 10)
        self.pdf.cell(
            box_w - 10, 4, "Recibir reporte de auditoria con puntos criticos priorizados", 0, 1, 'L', fill=True)
        self.pdf.set_x(box_x + 10)
        self.pdf.cell(
            box_w - 10, 4, "Comenzar implementacion de mejoras segun impacto financiero", 0, 1, 'L', fill=True)

        # SEGUIMIENTO
        self.pdf.set_font(self.font_family, 'B', 9)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self.pdf.set_x(box_x + 5)
        self.pdf.cell(box_w - 5, 5, "SEGUIMIENTO (Cada 30 dias):",
                      0, 1, 'L', fill=True)

        self.pdf.set_font(self.font_family, '', 8)
        self.pdf.set_text_color(30, 30, 30)
        self.pdf.set_x(box_x + 10)
        self.pdf.cell(
            box_w - 10, 4, "Medir cambios en bounce, conversion y abandono", 0, 1, 'L', fill=True)
        self.pdf.set_x(box_x + 10)
        self.pdf.cell(
            box_w - 10, 4, "Ajustar estrategia segun datos del proximo reporte", 0, 1, 'L', fill=True)

        # Barra de acento navy al inicio
        box_h = self.pdf.get_y() - y_ini
        self.pdf.set_fill_color(*self.AZUL_NAVY)
        self.pdf.rect(box_x, y_ini, 3, box_h, 'F')

        self.pdf.ln(2)
        self.pdf.set_text_color(0, 0, 0)

    def _draw_services_this_month(self):
        """Sección SERVICIOS INCLUIDOS con lista detallada de servicios."""
        self.pdf.ln(2)

        # Titulo de seccion
        self.pdf.set_font(self.font_family, 'B', 12)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self._section_title("📋", "SERVICIOS INCLUIDOS")
        self.pdf.ln(2)

        # Servicios incluidos
        services = [
            ("1. Copias de seguridad nube", [
                "Base de datos + Archivos del sitio.",
                "Almacenadas en la nube.",
                "Se realizan todos los dias durante el periodo (o ante eventos criticos).",
                "Se retienen durante (2) dos anos."
            ]),
            ("2. Mantenimiento | Actualizaciones", [
                "Sistema, plugins y temas.",
                "Revision de compatibilidad, estabilidad y mejoras."
            ]),
            ("3. Revision de SEO, accesibilidad y seguridad", [
                "Accesos, contrasenas, spam, rendimiento, SEO basico, accesibilidad, etc."
            ]),
            ("4. Soporte tecnico", [
                "Via WhatsApp o correo, para ajustes simples y consultas."
            ])
        ]

        self.pdf.set_font(self.font_family, '', 9)
        self.pdf.set_text_color(30, 30, 30)

        for service_title, details in services:
            # Titulo del servicio
            self.pdf.set_font(self.font_family, 'B', 9)
            self.pdf.set_text_color(*self.AZUL_NAVY)
            self.pdf.cell(0, 4, service_title, 0, 1, 'L')

            # Detalles del servicio
            self.pdf.set_font(self.font_family, '', 8)
            self.pdf.set_text_color(30, 30, 30)
            for detail in details:
                self.pdf.set_x(15)
                self.pdf.multi_cell(175, 3, f"  {detail}", border=0, align='L')

            self.pdf.ln(1)

        self.pdf.set_text_color(0, 0, 0)

    # ─── PAGE 2: TECHNICAL DETAILS ─────────────────────────────────

    def _header_technical(self):
        """Header liviano para pagina de detalle tecnico."""
        self.pdf.set_fill_color(*self.AZUL_NAVY)
        self.pdf.rect(0, 0, 210, 20, 'F')
        self.pdf.set_font(self.font_family, 'B', 14)
        self.pdf.set_text_color(255, 255, 255)
        self.pdf.set_xy(10, 5)
        self.pdf.cell(
            0, 10, f"Detalle Tecnico - {self.cliente_nombre}", 0, 1, 'L')
        self.pdf.set_y(25)

    def _draw_storage_detail(self):
        """Detalle de almacenamiento con barra de progreso para pagina 2."""
        if not self.infra_data:
            return

        percentage = self.infra_data.get('disk_used_percentage', 0)
        used_gb = self.infra_data.get('disk_used_gb', 0)
        total_gb = self.infra_data.get('disk_total_gb', 0)

        if total_gb == 0:
            return

        self.pdf.ln(5)
        self.pdf.set_font(self.font_family, 'B', 11)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self.pdf.cell(0, 8, "Almacenamiento del Servidor", 0, 1, 'L')

        # Barra de progreso completa
        bar_width = 190
        bar_height = self.DETAIL_BAR_HEIGHT
        bar_x = 10
        bar_y = self.pdf.get_y()

        self.pdf.set_fill_color(220, 220, 220)
        self.pdf.rect(bar_x, bar_y, bar_width, bar_height, 'F')

        fill_color = self.ROJO_ALERTA if percentage >= 80 else self.AZUL_NAVY
        fill_width = (percentage / 100) * bar_width
        self.pdf.set_fill_color(*fill_color)
        self.pdf.rect(bar_x, bar_y, fill_width, bar_height, 'F')

        self.pdf.ln(7)

        # Texto descriptivo
        self.pdf.set_font(self.font_family, '', 9)
        if percentage >= 80:
            self.pdf.set_text_color(*self.ROJO_ALERTA)
            self.pdf.multi_cell(
                0, 5, f"{used_gb} GB usados de {total_gb} GB totales - Tu espacio en disco esta llegando al limite. Recomendamos una limpieza o ampliacion proximamente.", 0, 'L')
        else:
            self.pdf.set_text_color(*self.GRIS_TEXT)
            self.pdf.multi_cell(
                0, 5, f"{used_gb} GB usados de {total_gb} GB totales - Contas con muy buen espacio disponible.", 0, 'L')
        self.pdf.set_text_color(0, 0, 0)
        self.pdf.ln(3)

    def _draw_analytics_detail(self):
        """Seccion de Analisis de Visibilidad con metricas Matomo y top paginas."""
        if not self.metrics_data:
            return

        self.pdf.ln(5)
        self.pdf.set_font(self.font_family, 'B', 11)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self.pdf.cell(0, 8, "Analisis de Visibilidad", 0, 1, 'L')
        self.pdf.ln(2)

        # Fila de 4 mini-tarjetas de metricas
        y_ini = self.pdf.get_y()
        card_w = self.CARD_W_WITHOUT_METRICS
        gap = self.CARD_GAP_WITHOUT_METRICS
        x_start = self.CARD_X_START
        metrics = [
            ("Visitas", f"{self.metrics_data.get('nb_visits', 0):,}"),
            ("Visitantes Unicos",
             f"{self.metrics_data.get('nb_uniq_visitors', 0):,}"),
            ("Tiempo Promedio", self._format_duration(
                self.metrics_data.get('avg_time_on_site', 0))),
            ("Tasa de Rebote",
             f"{self.metrics_data.get('bounce_rate', 0):.1f}%"),
        ]

        for i, (label, value) in enumerate(metrics):
            x = x_start + i * (card_w + gap)
            self.pdf.set_fill_color(*self.GRIS_HEAD)
            self.pdf.rect(x, y_ini, card_w, 16, 'F')
            self.pdf.set_xy(x, y_ini + 2)
            self.pdf.set_font(self.font_family, '', 7)
            self.pdf.set_text_color(*self.GRIS_TEXT)
            self.pdf.cell(card_w, 4, label, 0, 1, 'C')
            self.pdf.set_x(x)
            self.pdf.set_font(self.font_family, 'B', 11)
            self.pdf.set_text_color(*self.AZUL_NAVY)
            self.pdf.cell(card_w, 6, value, 0, 0, 'C')

        self.pdf.set_y(y_ini + 20)

        # Tabla de paginas mas visitadas
        top_pages = self.metrics_data.get('top_pages', [])
        if top_pages:
            self.pdf.set_font(self.font_family, 'B', 9)
            self.pdf.set_text_color(*self.AZUL_NAVY)
            self.pdf.cell(0, 7, "Paginas mas visitadas", 0, 1, 'L')

            # Header de tabla
            self.pdf.set_fill_color(*self.AZUL_NAVY)
            self.pdf.set_text_color(255, 255, 255)
            self.pdf.set_font(self.font_family, 'B', 8)
            self.pdf.cell(120, 6, "  Pagina", 0, 0, 'L', True)
            self.pdf.cell(35, 6, "Visitas", 0, 0, 'C', True)
            self.pdf.cell(35, 6, "Hits", 0, 1, 'C', True)

            # Filas
            self.pdf.set_font(self.font_family, '', 8)
            self.pdf.set_text_color(30, 30, 30)
            for i, page in enumerate(top_pages):
                fill = i % 2 == 0
                if fill:
                    self.pdf.set_fill_color(*self.GRIS_HEAD)
                label = page.get('label', '')[:55]
                self.pdf.cell(120, 6, f"  {label}", 0, 0, 'L', fill)
                self.pdf.cell(35, 6, str(
                    page.get('nb_visits', 0)), 0, 0, 'C', fill)
                self.pdf.cell(35, 6, str(page.get('nb_hits', 0)),
                              0, 1, 'C', fill)

        self.pdf.set_text_color(0, 0, 0)
        self.pdf.ln(5)

    def _format_duration(self, seconds):
        """Formatea segundos como mm:ss."""
        minutes = int(seconds) // 60
        secs = int(seconds) % 60
        return f"{minutes}:{secs:02d}"

    def _draw_maintenance_table(self):
        """Resumen del ecosistema (WP, PHP, Plugins)."""
        if not self.maintenance_data and not self.infra_data:
            return

        self.pdf.ln(5)
        self.pdf.set_font(self.font_family, 'B', 11)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self.pdf.cell(0, 8, "Estado del Ecosistema", 0, 1, 'L')
        self.pdf.ln(2)

        x_start = self.pdf.get_x()
        box_w = self.TABLE_COL_NAME_W + self.TABLE_COL_VAL_W
        spacing = 2

        # 1. WordPress
        wp_version = self.infra_data.get('wp_version', 'Desconocida') if self.infra_data else 'Desconocida'
        pending_wp = self.maintenance_data.get('pending_updates', {}).get('wordpress', 0) if self.maintenance_data else 0
        wp_status = "Actualizacion pendiente" if pending_wp > 0 else "Actualizado a la ultima version"
        wp_color = self.AMARILLO_WARN if pending_wp > 0 else self.VERDE_OK

        self.pdf.set_fill_color(*self.GRIS_HEAD)
        self.pdf.rect(x_start, self.pdf.get_y(), box_w, 10, 'F')
        self.pdf.set_font(self.font_family, 'B', 9)
        self.pdf.set_text_color(30, 30, 30)
        self.pdf.set_xy(x_start + 3, self.pdf.get_y() + 3)
        self.pdf.cell(40, 4, f"WordPress {wp_version}", 0, 0, 'L')
        self.pdf.set_font(self.font_family, '', 9)
        self.pdf.set_text_color(*wp_color)
        self.pdf.cell(0, 4, wp_status, 0, 1, 'L')

        # 2. PHP
        self.pdf.set_y(self.pdf.get_y() + spacing + 6)
        php_version = self.infra_data.get('php_version', 'Desconocida') if self.infra_data else 'Desconocida'
        is_safe_php = str(php_version).startswith('8.')
        php_status = "Version segura y compatible" if is_safe_php else "Requiere actualizacion (" + str(php_version) + ")"
        php_color = self.VERDE_OK if is_safe_php else self.AMARILLO_WARN

        self.pdf.set_fill_color(*self.GRIS_HEAD)
        self.pdf.rect(x_start, self.pdf.get_y(), box_w, 10, 'F')
        self.pdf.set_font(self.font_family, 'B', 9)
        self.pdf.set_text_color(30, 30, 30)
        self.pdf.set_xy(x_start + 3, self.pdf.get_y() + 3)
        self.pdf.cell(40, 4, f"Motor PHP", 0, 0, 'L')
        self.pdf.set_font(self.font_family, '', 9)
        self.pdf.set_text_color(*php_color)
        self.pdf.cell(0, 4, php_status, 0, 1, 'L')

        # 3. Plugins
        self.pdf.set_y(self.pdf.get_y() + spacing + 6)
        total_plugins = self.maintenance_data.get('total_active_plugins', 0) if self.maintenance_data else 0
        pending_plugins = self.maintenance_data.get('pending_updates', {}).get('plugins', 0) if self.maintenance_data else 0
        updated_plugins = max(0, total_plugins - pending_plugins) if total_plugins > 0 else 0
        
        plugins_title = f"{total_plugins} Plugins activos"
        if total_plugins > 0:
            plugins_status = f"{updated_plugins} al dia y {pending_plugins} pendientes" if pending_plugins > 0 else "100% actualizados a la ultima version"
        else:
            plugins_status = f"{pending_plugins} pendientes" if pending_plugins > 0 else "Sin datos"
        
        plugins_color = self.AMARILLO_WARN if pending_plugins > 0 else self.VERDE_OK

        self.pdf.set_fill_color(*self.GRIS_HEAD)
        self.pdf.rect(x_start, self.pdf.get_y(), box_w, 10, 'F')
        self.pdf.set_font(self.font_family, 'B', 9)
        self.pdf.set_text_color(30, 30, 30)
        self.pdf.set_xy(x_start + 3, self.pdf.get_y() + 3)
        self.pdf.cell(40, 4, plugins_title, 0, 0, 'L')
        self.pdf.set_font(self.font_family, '', 9)
        self.pdf.set_text_color(*plugins_color)
        self.pdf.cell(0, 4, plugins_status, 0, 1, 'L')

        self.pdf.set_y(self.pdf.get_y() + 10)
        self.pdf.set_text_color(0, 0, 0)

    def _draw_security_detail(self):
        """Detalle de seguridad Wordfence con tablas de IPs y URLs atacadas."""
        if not self.wordfence_data or self.wordfence_data.get('total_attacks', 0) == 0:
            return

        self.pdf.ln(5)
        self.pdf.set_font(self.font_family, 'B', 11)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self.pdf.cell(0, 8, "Detalle de Seguridad", 0, 1, 'L')
        self.pdf.ln(2)

        # Summary line
        total = self.wordfence_data.get('total_attacks', 0)
        last_scan = self.wordfence_data.get('last_scan', 'No disponible')
        self.pdf.set_font(self.font_family, '', 10)
        self.pdf.set_text_color(30, 30, 30)
        self.pdf.cell(
            0, 6, f"{total:,} ataques bloqueados en los ultimos 30 dias  |  Ultimo escaneo: {last_scan}", 0, 1, 'L')
        self.pdf.ln(3)

        # Top IPs table
        top_ips = self.wordfence_data.get('top_ips', [])
        if top_ips:
            self.pdf.set_font(self.font_family, 'B', 9)
            self.pdf.set_fill_color(*self.AZUL_NAVY)
            self.pdf.set_text_color(255, 255, 255)
            self.pdf.cell(self.TABLE_COL_IP_W, 7,
                          "Top IPs Bloqueadas", 1, 0, 'L', fill=True)
            self.pdf.cell(self.TABLE_COL_IP_W, 7,
                          "Intentos", 1, 1, 'C', fill=True)

            self.pdf.set_font(self.font_family, '', 9)
            for i, ip_row in enumerate(top_ips[:5]):
                bg = self.GRIS_HEAD if i % 2 == 0 else (255, 255, 255)
                self.pdf.set_fill_color(*bg)
                self.pdf.set_text_color(30, 30, 30)
                self.pdf.cell(self.TABLE_COL_IP_W, 6, str(
                    ip_row.get('ip', '')), 1, 0, 'L', fill=True)
                self.pdf.cell(self.TABLE_COL_IP_W, 6, str(
                    ip_row.get('count', 0)), 1, 1, 'C', fill=True)
            self.pdf.ln(3)

        # Top URLs table
        top_urls = self.wordfence_data.get('top_urls', [])
        if top_urls:
            self.pdf.set_font(self.font_family, 'B', 9)
            self.pdf.set_fill_color(*self.AZUL_NAVY)
            self.pdf.set_text_color(255, 255, 255)
            self.pdf.cell(self.TABLE_COL_NAME_W, 7,
                          "Top URLs Atacadas", 1, 0, 'L', fill=True)
            self.pdf.cell(self.TABLE_COL_VAL_W, 7,
                          "Intentos", 1, 1, 'C', fill=True)

            self.pdf.set_font(self.font_family, '', 9)
            for i, url_row in enumerate(top_urls[:3]):
                bg = self.GRIS_HEAD if i % 2 == 0 else (255, 255, 255)
                self.pdf.set_fill_color(*bg)
                self.pdf.set_text_color(30, 30, 30)
                url = str(url_row.get('url', ''))
                url_text = url[:57] + '...' if len(url) > 60 else url
                self.pdf.cell(self.TABLE_COL_NAME_W, 6,
                              url_text, 1, 0, 'L', fill=True)
                self.pdf.cell(self.TABLE_COL_VAL_W, 6, str(
                    url_row.get('count', 0)), 1, 1, 'C', fill=True)

        self.pdf.ln(5)

    def _draw_exit_pages(self):
        """Tabla de paginas con mayor tasa de salida."""
        exit_pages = self.metrics_data.get(
            'exit_pages', []) if self.metrics_data else []
        if not exit_pages:
            return

        self.pdf.ln(5)
        self.pdf.set_font(self.font_family, 'B', 11)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self.pdf.cell(0, 8, "Paginas con mayor abandono", 0, 1, 'L')

        # Table header
        self.pdf.set_fill_color(*self.AZUL_NAVY)
        self.pdf.set_text_color(255, 255, 255)
        self.pdf.set_font(self.font_family, 'B', 8)
        self.pdf.cell(120, 6, "  Pagina", 0, 0, 'L', True)
        self.pdf.cell(35, 6, "Visitas", 0, 0, 'C', True)
        self.pdf.cell(35, 6, "Tasa de salida", 0, 1, 'C', True)

        # Table rows
        self.pdf.set_font(self.font_family, '', 8)
        self.pdf.set_text_color(30, 30, 30)
        for i, page in enumerate(exit_pages[:5]):
            fill = i % 2 == 0
            if fill:
                self.pdf.set_fill_color(*self.GRIS_HEAD)
            label = page.get('label', '')[:55]
            exit_rate = page.get('exit_rate', 0)
            self.pdf.cell(120, 6, f"  {label}", 0, 0, 'L', fill)
            self.pdf.cell(35, 6, str(page.get('nb_visits', 0)),
                          0, 0, 'C', fill)
            self.pdf.cell(35, 6, f"{exit_rate}%", 0, 1, 'C', fill)

        self.pdf.set_text_color(0, 0, 0)
        self.pdf.ln(5)

    def _add_manual_tasks(self):
        if not self.improved_text:
            return

        self.pdf.ln(5)
        self.pdf.set_font(self.font_family, 'B', 14)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self.pdf.cell(0, 10, "Optimizacion Proactiva", 0, 1, 'L')

        self.pdf.set_font(self.font_family, '', 11)
        self.pdf.set_text_color(20, 20, 20)
        self.pdf.set_fill_color(*self.GRIS_HEAD)
        self.pdf.multi_cell(
            0, 8, f"{self.improved_text}", border=1, align='J', fill=True)
        self.pdf.ln(10)

    def _add_visual_evidence(self):
        if not self.antes_path and not self.despues_path:
            return

        self.pdf.ln(5)
        self.pdf.set_font(self.font_family, 'B', 12)
        self.pdf.set_text_color(*self.AZUL_NAVY)
        self.pdf.cell(0, 10, "Antes & Despues", 0, 1, 'L')

        img_w = 90
        x1, x2 = 10, 110
        y_pos = self.pdf.get_y()

        def process_img(path):
            try:
                img = Image.open(path)
                img.thumbnail((1024, 1024))
                webp_path = path.rsplit(
                    '.', 1)[0] + f"_{datetime.datetime.now().microsecond}.webp"
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
                    label_y = y_pos+img_w/1.5 + 8
                    self.pdf.set_fill_color(*self.GRIS_HEAD)
                    self.pdf.rect(x_pos, label_y-1, img_w, 6, 'F')
                    self.pdf.set_xy(x_pos, label_y)
                    self.pdf.set_font(self.font_family, 'B', 9)
                    self.pdf.set_text_color(*self.AZUL_NAVY)
                    self.pdf.cell(img_w, 5, label, 0, 0, 'C')
                    self.pdf.set_text_color(0, 0, 0)

        self.pdf.ln(10)

    # ─── GENERATE ──────────────────────────────────────────────────

    def generate(self, filename):
        # PAGE 1: Executive Dashboard
        self.pdf.add_page()
        self._header_premium()
        self._draw_operational_health()
        self._draw_business_impact()
        self._draw_device_breakdown()
        self._draw_conversions()
        self._draw_hoja_de_ruta()

        # PAGE: Financial Summary (dedicated page)
        self.pdf.add_page()
        self._header_premium()
        self._draw_financial_summary()
        self._draw_cta_section()
        self._draw_services_this_month()

        # PAGE 2: Technical Details (only if there's content)
        has_technical = (
            bool(self.improved_text)
            or self.antes_path
            or self.despues_path
            or bool(self.infra_data)
            or bool(self.metrics_data)
            or bool(self.wordfence_data)
            or bool(self.maintenance_data)
        )
        if has_technical:
            self.pdf.add_page()
            self._header_technical()
            self._draw_storage_detail()
            self._draw_maintenance_table()
            self._draw_security_detail()
            self._draw_analytics_detail()
            self._draw_exit_pages()
            self._add_manual_tasks()
            self._add_visual_evidence()

        if not os.path.exists("reportes"):
            os.makedirs("reportes")

        save_path = os.path.join("reportes", filename)
        self.pdf.output(save_path)
        return save_path


if __name__ == "__main__":
    gen = PDFGenerator(
        "CGA",
        "Hemos optimizado el tiempo de respuesta del servidor.",
        infra_data={'disk_used_percentage': 36,
                    'disk_used_gb': 4476, 'disk_total_gb': 12336},
        ssl_days=45,
        hoja_de_ruta=(
            "- Reducir bounce rate en mobile (58%)\n"
            "  Problema: 540 visitantes moviles/mes, 58% se va sin interactuar\n"
            "  Accion: Auditoria UX/UI + Rediseno responsive\n"
            "  Inversion: Gs. 1.500.000\n"
            "  Retorno: Si reducimos a 45%, ganamos +70 visitantes = Gs. 1,050,000/mes\n"
            "- Reducir abandono en /carrito (67%)\n"
            "  Problema: De 180 visitas, 121 se van sin completar\n"
            "  Accion: Simplificar flujo + agregar recuperacion de carrito\n"
            "  Inversion: Gs. 300.000\n"
            "  Retorno: Si recuperamos 20%, ganamos +24 conversiones = Gs. 1,200,000/mes\n"
            "- Mejorar fotos de productos\n"
            "  Problema: 320 visitas/mes a /productos, conversion baja\n"
            "  Accion: Refotos profesionales + descripciones mejoradas\n"
            "  Inversion: Gs. 800.000\n"
            "  Retorno: +15 compras/mes = Gs. 450,000/mes"
        ),
        metrics_data={
            'nb_visits': 1250, 'nb_uniq_visitors': 870, 'nb_actions': 3400,
            'nb_actions_per_visit': 2.7,
            'avg_time_on_site': 185, 'bounce_rate': 42.5,
            'top_pages': [
                {'label': '/productos', 'nb_visits': 320, 'nb_hits': 450},
                {'label': '/contacto', 'nb_visits': 180, 'nb_hits': 210},
                {'label': '/nosotros', 'nb_visits': 95, 'nb_hits': 120},
            ],
            'prev_month': {
                'nb_visits': 1470, 'nb_uniq_visitors': 1020,
                'avg_time_on_site': 207, 'bounce_rate': 39.2,
                'nb_actions_per_visit': 2.5,
            },
            'devices': [
                {'label': 'Desktop', 'nb_visits': 650, 'bounce_rate': 28.0},
                {'label': 'Smartphone', 'nb_visits': 540, 'bounce_rate': 58.0},
                {'label': 'Tablet', 'nb_visits': 60, 'bounce_rate': 35.0},
            ],
            'exit_pages': [
                {'label': '/carrito', 'nb_visits': 180, 'exit_rate': 67},
                {'label': '/pago', 'nb_visits': 120, 'exit_rate': 54},
                {'label': '/producto-detail', 'nb_visits': 95, 'exit_rate': 42},
            ],
            'conversions': None,
        },
        wordfence_data={
            'total_attacks': 247,
            'top_ips': [
                {'ip': '192.168.1.100', 'count': 85},
                {'ip': '10.0.0.55', 'count': 62},
                {'ip': '172.16.0.33', 'count': 41},
            ],
            'top_urls': [
                {'url': '/wp-login.php', 'count': 120},
                {'url': '/xmlrpc.php', 'count': 95},
                {'url': '/wp-admin/', 'count': 32},
            ],
            'last_scan': '2026-03-18 14:30:00'
        },
        maintenance_data={
            'pending_updates': {'plugins': 2, 'themes': 0, 'wordpress': 0},
            'recent_updates': [
                {'name': 'Wordfence Security', 'version': '7.11.0'},
                {'name': 'WooCommerce', 'version': '8.5.2'},
                {'name': 'Elementor', 'version': '3.19.0'},
                {'name': 'UpdraftPlus', 'version': '1.24.1'},
                {'name': 'Yoast SEO', 'version': '22.0'},
            ],
            'site_health': 'Good',
            'last_backup': '2026-03-17 03:00:00'
        },
        recommendations=[
            {'title': 'Reducir bounce en mobile', 'action': 'Auditoria UX/UI + Rediseno responsive',
             'investment': 'Gs. 1.500.000', 'investment_num': 1500000, 'roi_monthly_num': 1050000},
            {'title': 'Reducir abandono en /carrito', 'action': 'Simplificar flujo + recuperacion de carrito',
             'investment': 'Gs. 300.000', 'investment_num': 300000, 'roi_monthly_num': 1200000},
            {'title': 'Mejorar fotos de productos', 'action': 'Refotos profesionales + descripciones',
             'investment': 'Gs. 800.000', 'investment_num': 800000, 'roi_monthly_num': 450000},
        ]
    )
    gen.generate("test_executive.pdf")
    print("Reporte ejecutivo generado con exito.")
