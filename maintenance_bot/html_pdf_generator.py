import datetime
import os
import logging
from weasyprint import HTML

logger = logging.getLogger(__name__)

MESES = {
    1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
    5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
    9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
}

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), 'templates')


class HTMLPDFGenerator:
    def __init__(self, cliente_nombre, improved_text, antes_img=None, despues_img=None,
                 infra_data=None, ssl_days=None, hoja_de_ruta=None, metrics_data=None,
                 wordfence_data=None, maintenance_data=None, recommendations=None, timeframe_name="Últimos 30 días",
                 audit_type=None, cta_implementation_text=None, audit_cost=None):
        self.cliente_nombre = cliente_nombre
        self.improved_text = improved_text
        self.timeframe_name = timeframe_name
        self.antes_path = antes_img
        self.despues_path = despues_img
        # IMPORTANT: Preserve None for infra_data to distinguish API failure from missing data
        # This allows proper null checking in _build_storage_section()
        self.infra_data = infra_data
        self.ssl_days = ssl_days
        self.hoja_de_ruta = hoja_de_ruta
        self.metrics_data = metrics_data or {}
        self.wordfence_data = wordfence_data or {}
        self.maintenance_data = maintenance_data or {}
        self.recommendations = recommendations or []
        self.audit_type = audit_type
        self.cta_implementation_text = cta_implementation_text or "Comenzar implementación de mejoras propuestas"
        self.audit_cost = audit_cost

    def _format_duration(self, seconds):
        minutes = int(seconds) // 60
        secs = int(seconds) % 60
        return f"{minutes}:{secs:02d}"

    # ─── SECTION BUILDERS ─────────────────────────────────────────

    def _build_health_cards(self):
        attacks = self.wordfence_data.get('total_attacks', 0)
        if attacks >= 1000000:
            security_text = f"{attacks/1000000:.1f}M"
        elif attacks >= 1000:
            security_text = f"{attacks/1000:.1f}k"
        else:
            security_text = str(attacks)

        security_label = "Intentos de ataque" if attacks == 0 else "Ataques bloqueados"

        active_shields = str(self.wordfence_data.get('active_shields', 6))

        ssl_days = self.ssl_days if self.ssl_days is not None else 0
        if ssl_days <= 0:
            ssl_value = "0 días"
            ssl_label = "Certificado expirado"
            ssl_extra = ""
        else:
            ssl_value = f"{ssl_days} días"
            ssl_label = "Renovación automática"
            ssl_extra = '<div style="font-size:8px;color:var(--text-secondary);font-style:italic;margin-top:4px;text-transform:none;letter-spacing:normal;font-weight:normal;">* Renovación automática habilitada</div>'

        pending = self.maintenance_data.get('pending_updates', {})
        total_pending = pending.get(
            'plugins', 0) + pending.get('themes', 0) + pending.get('wordpress', 0)
        updates_value = "0" if total_pending == 0 else str(total_pending)
        updates_label = "Actualiz. pendientes"

        cards = [
            ("100%", "Tiempo en línea", ""),
            (security_text, security_label, ""),
            (active_shields, "Escudos activos", ""),
            (ssl_value, ssl_label, ssl_extra),
            (updates_value, updates_label, ""),
            ("1 x día", "Respaldos remotos", ""),
        ]

        html = ""
        for number, label, extra in cards:
            # Drop the inline style that might have messed up the CSS size
            html += f'''
                <div class="health-card">
                    <div class="health-card-number">{number}</div>
                    <div class="health-card-label">{label}{extra}</div>
                </div>'''

        # The template has a health-grid flex layout which naturally wraps 2 items per row
        return html

    def _build_metrics_section(self):
        if not self.metrics_data:
            return '<div class="metric-card" style="grid-column: 1/-1; text-align: center; padding: 20px;"><div class="metric-secondary">Pronto tendremos más información sobre las métricas de tu web.</div></div>'

        prev = self.metrics_data.get('prev_month', {})

        def calc_trend(current, prev_val):
            if prev_val and prev_val > 0:
                return ((current - prev_val) / prev_val) * 100
            return None

        def trend_html(trend, invert=False):
            if trend is None:
                return ""
            if invert:
                trend = -trend
            cls = "trend-up" if trend >= 0 else "trend-down"
            arrow = "▲" if trend >= 0 else "▼"
            return f'<div class="metric-trend {cls}">{arrow} {trend:+.0f}%</div>'

        nb_visits = self.metrics_data.get('nb_visits', 0)
        visitors = self.metrics_data.get('nb_uniq_visitors', 0)
        has_unique_visitors = not (visitors == 0 and nb_visits > 0)
        ppv = self.metrics_data.get('nb_actions_per_visit', 0)
        avg_time = self._format_duration(
            self.metrics_data.get('avg_time_on_site', 0))
        avg_time_val = self.metrics_data.get('avg_time_on_site', 0)
        bounce = self.metrics_data.get('bounce_rate', 0)

        cards = []
        if has_unique_visitors:
            cards.append((f"{visitors:,}", "Visitantes únicos", trend_html(
                calc_trend(visitors, prev.get('nb_uniq_visitors')))))
        cards += [
            (f"{ppv:.1f}", "Páginas por visita", trend_html(
                calc_trend(ppv, prev.get('nb_actions_per_visit')))),
            (avg_time, "Tiempo promedio", trend_html(
                calc_trend(avg_time_val, prev.get('avg_time_on_site')))),
            (f"{bounce:.1f}%", "Tasa de rebote", trend_html(
                calc_trend(bounce, prev.get('bounce_rate')), invert=True)),
        ]

        cols = len(cards)
        html = f'<div class="metrics-grid" style="grid-template-columns: {"1fr " * cols};">'
        for value, label, trend in cards:
            html += f'''
                <div class="metric-card">
                    <div class="metric-top">
                        <div class="metric-main">{value}</div>
                        {trend}
                    </div>
                    <div class="metric-secondary">{label}</div>
                </div>'''
        html += '</div>'
        return html

    def _build_device_section(self):
        devices = self.metrics_data.get(
            'devices', []) if self.metrics_data else []
        if not devices:
            return ""

        total_visits = sum(d.get('nb_visits', 0) for d in devices)
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
        desktop_pct = (desktop['nb_visits'] /
                       total_visits * 100) if total_visits > 0 else 0
        mobile_pct = (mobile['nb_visits'] / total_visits *
                      100) if total_visits > 0 else 0

        desktop_status = '<div class="device-good">Comportamiento óptimo</div>' if desktop_bounce < 40 else '<div class="device-alert">Requiere atención</div>'
        mobile_status = '<div class="device-alert">Requiere optimización urgente</div>' if mobile_bounce > 50 else '<div class="device-good">Comportamiento aceptable</div>'

        # Browsers & OS (top 2 each)
        browsers = self.metrics_data.get('browsers', [])[:2] if self.metrics_data else []
        os_families = self.metrics_data.get('os_families', [])[:2] if self.metrics_data else []

        def format_top2(items):
            if not items:
                return ''
            parts = []
            for i in items:
                pct = (i['nb_visits'] / total_visits * 100) if total_visits > 0 else 0
                parts.append(f'{i["label"]} {pct:.0f}%')
            return ' · '.join(parts)

        browser_stat = f'<div class="device-stat"><span class="device-stat-label">Nav: </span><span class="device-stat-value">{format_top2(browsers)}</span></div>' if browsers else ''
        os_stat = f'<div class="device-stat"><span class="device-stat-label">SO: </span><span class="device-stat-value">{format_top2(os_families)}</span></div>' if os_families else ''

        return f'''
        <div class="section">
            <h2 class="section-title">Comportamiento por Dispositivo</h2>
            <div class="device-grid">
                <div class="device-card">
                    <div class="device-name">Desktop</div>
                    <div class="device-stats-inline">
                        <div class="device-stat"><span class="device-stat-label">Visitas: </span><span class="device-stat-value">{desktop["nb_visits"]:,} ({desktop_pct:.0f}%)</span></div>
                        <div class="device-stat"><span class="device-stat-label">Rebote: </span><span class="device-stat-value">{desktop_bounce:.1f}%</span></div>
                        {browser_stat}
                    </div>
                    {desktop_status}
                </div>
                <div class="device-card">
                    <div class="device-name">Mobile</div>
                    <div class="device-stats-inline">
                        <div class="device-stat"><span class="device-stat-label">Visitas: </span><span class="device-stat-value">{mobile["nb_visits"]:,} ({mobile_pct:.0f}%)</span></div>
                        <div class="device-stat"><span class="device-stat-label">Rebote: </span><span class="device-stat-value">{mobile_bounce:.1f}%</span></div>
                        {os_stat}
                    </div>
                    {mobile_status}
                </div>
            </div>
        </div>'''

    def _build_steps_section(self):
        if not self.hoja_de_ruta:
            return ""

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
                current_step['details'].append(stripped)
        if current_step:
            steps.append(current_step)

        steps_html = ""
        for i, step in enumerate(steps[:3]):
            details_html = ""
            for detail in step['details']:
                for label in ['Problema:', 'Accion:', 'Inversion:', 'Retorno:']:
                    if detail.strip().startswith(label):
                        value = detail.strip()[len(label):].strip()
                        highlight_class = "text-cyan" if label == "Retorno:" else ""
                        details_html += f'<div class="step-detail"><span class="step-highlight">{label}</span> <span class="{highlight_class}">{value}</span></div>'
                        break
                else:
                    details_html += f'<div class="step-detail">{detail.strip()}</div>'

            steps_html += f'''
                <div class="step">
                    <div class="step-number">Paso {i+1}: {step["title"]}</div>
                    {details_html}
                </div>'''

        return f'''
        <div class="section">
            <h2 class="section-title">Siguientes Pasos</h2>
            <div class="steps-container">
                {steps_html}
            </div>
        </div>'''

    def _build_financial_section(self):
        return ""

    def _build_cta_section(self):
        calendar_url = os.getenv('CALENDAR_URL', '')
        calendar_line = f'<div class="cta-phase-text">Agendar: {calendar_url}</div>' if calendar_url else ''
        cost_line = f'<div class="cta-phase-text" style="margin-top:5px;"><strong>Costo de auditoría:</strong> Gs. {self.audit_cost}</div>' if self.audit_cost else ''
        subtitle = f'<div style="font-size:11px;color:var(--text-secondary);margin-bottom:10px;">Auditoría Estratégica: {self.audit_type}</div>' if self.audit_type else ''
        return f'''
        <div class="cta-section">
            <h3 class="cta-title">Próximos Pasos</h3>
            {subtitle}
            <div class="cta-phase">
                <div class="cta-phase-title">LO ANTES POSIBLE (Esta semana o la próxima):</div>
                <div class="cta-phase-text">Agendar auditoría estratégica</div>
                {calendar_line}
                {cost_line}
            </div>
            <div class="cta-phase" style="margin-top: 10px;">
                <div class="cta-phase-title">A CORTO PLAZO (Próximas 2 a 4 semanas):</div>
                <div class="cta-phase-text">Recibir reporte con puntos de mejora</div>
                <div class="cta-phase-text">Comenzar ajustes de diseño</div>
            </div>
            <div class="cta-phase">
                <div class="cta-phase-title">SEGUIMIENTO PERIÓDICO:</div>
                <div class="cta-phase-text">Mantenimiento constante ya incluido + resúmenes estratégicos y de mantenimiento</div>
                <div class="cta-phase-text">Alineación estratégica conforme necesidades del cliente</div>
            </div>
        </div>'''

    # ─── PAGE 2 BUILDERS ──────────────────────────────────────────

    def _build_storage_section(self):
        if self.infra_data is None:
            return ""
        site_size_gb = self.infra_data.get('site_size_gb')
        if not site_size_gb:
            return ""

        def fmt_size(gb):
            if gb >= 1000:
                return f"{gb/1024:.1f} TB"
            return f"{gb:.1f} GB"

        size_str = fmt_size(site_size_gb)
        return f'''
        <div class="section">
            <h2 class="section-title">Almacenamiento del Sitio</h2>
            <div class="detail-card"><div class="detail-label">Espacio utilizado por el sitio</div><div class="detail-value">{size_str}</div><div class="step-detail" style="margin-top:5px;">Incluye archivos, plugins, temas y medios subidos.</div></div>
        </div>'''

    def _build_maintenance_section(self):
        if not self.maintenance_data and self.infra_data is None:
            return ""

        wp_version = self.infra_data.get('wp_version', 'Desconocida') if self.infra_data else 'Desconocida'
        pending_wp = self.maintenance_data.get('pending_updates', {}).get('wordpress', 0) if self.maintenance_data else 0
        wp_status = "Actualizacion pendiente" if pending_wp > 0 else "Actualizado a la ultima version"
        wp_class = "text-danger" if pending_wp > 0 else "text-success"

        php_version = self.infra_data.get('php_version', 'Desconocida') if self.infra_data else 'Desconocida'
        is_safe_php = str(php_version).startswith('8.')
        php_status = "Version segura y compatible" if is_safe_php else f"Requiere actualizacion ({php_version})"
        php_class = "text-success" if is_safe_php else "text-danger"

        total_plugins = self.maintenance_data.get('total_active_plugins', 0) if self.maintenance_data else 0
        pending_plugins = self.maintenance_data.get('pending_updates', {}).get('plugins', 0) if self.maintenance_data else 0
        updated_plugins = max(0, total_plugins - pending_plugins) if total_plugins > 0 else 0
        
        plugins_title = f"{total_plugins} Plugins activos"
        if total_plugins > 0:
            plugins_status = f"{updated_plugins} al dia y {pending_plugins} pendientes" if pending_plugins > 0 else "100% actualizados a la ultima version"
        else:
            plugins_status = f"{pending_plugins} pendientes" if pending_plugins > 0 else "Sin datos"
        plugins_class = "text-danger" if pending_plugins > 0 else "text-success"

        card_style = "flex:1;background:#f5f8fa;padding:10px 12px;border-radius:6px;border:1px solid rgba(0,102,204,0.15);"
        label_style = "font-size:9px;color:var(--text-secondary);text-transform:uppercase;font-weight:600;margin-bottom:4px;letter-spacing:0.3px;"
        value_style = "font-weight:700;color:var(--text-white);font-size:13px;margin-bottom:4px;"
        return f'''
        <div class="section">
            <h2 class="section-title">Estado del Ecosistema</h2>
            <div style="display:flex;gap:8px;">
                <div style="{card_style}">
                    <div style="{label_style}">WordPress</div>
                    <div style="{value_style}">v{wp_version}</div>
                    <div class="{wp_class}" style="font-size:10px;">{wp_status}</div>
                </div>
                <div style="{card_style}">
                    <div style="{label_style}">Motor PHP</div>
                    <div style="{value_style}">v{php_version}</div>
                    <div class="{php_class}" style="font-size:10px;">{php_status}</div>
                </div>
                <div style="{card_style}">
                    <div style="{label_style}">Plugins</div>
                    <div style="{value_style}">{total_plugins} activos</div>
                    <div class="{plugins_class}" style="font-size:10px;">{plugins_status}</div>
                </div>
            </div>
        </div>'''

    def _build_security_section(self):
        if not self.wordfence_data or self.wordfence_data.get('total_attacks', 0) == 0:
            return ""
        total = self.wordfence_data.get('total_attacks', 0)
        last_scan = self.wordfence_data.get('last_scan', 'No disponible')
        ip_rows = "".join(
            f"<tr><td>{ip.get('ip', '')}</td><td>{ip.get('count', 0)}</td></tr>" for ip in self.wordfence_data.get('top_ips', [])[:5])
        url_rows = "".join(
            f"<tr><td>{u.get('url', '')[:60]}</td><td>{u.get('count', 0)}</td></tr>" for u in self.wordfence_data.get('top_urls', [])[:3])
        return f'''
        <div class="section">
            <h2 class="section-title">Detalle de Seguridad</h2>
            <div class="detail-card"><div class="detail-label">Últimos 30 días</div><div class="detail-value text-success">{total:,} ataques bloqueados</div><div class="step-detail" style="margin-top:5px;">Último escaneo: {last_scan}</div></div>
            <h3 class="section-title" style="margin-top:15px;font-size:12px;">Top IPs Bloqueadas</h3>
            <div class="table-container"><table><thead><tr><th>IP</th><th>Intentos</th></tr></thead><tbody>{ip_rows}</tbody></table></div>
            <h3 class="section-title" style="margin-top:15px;font-size:12px;">Top URLs Atacadas</h3>
            <div class="table-container"><table><thead><tr><th>URL</th><th>Intentos</th></tr></thead><tbody>{url_rows}</tbody></table></div>
        </div>'''

    def _build_analytics_section(self):
        if not self.metrics_data:
            return ""
        visits = self.metrics_data.get('nb_visits', 0)
        visitors = self.metrics_data.get('nb_uniq_visitors', 0)
        has_unique_visitors = not (visitors == 0 and visits > 0)
        avg_time = self._format_duration(
            self.metrics_data.get('avg_time_on_site', 0))
        bounce = self.metrics_data.get('bounce_rate', 0)
        top_pages = self.metrics_data.get('top_pages', [])
        page_rows = "".join(
            f"<tr><td>{p.get('label', '')}</td><td>{p.get('nb_visits', 0)}</td><td>{p.get('nb_hits', 0)}</td></tr>" for p in top_pages)
        visitors_card = f'<div class="detail-card"><div class="detail-label">Visitantes Únicos</div><div class="detail-value">{visitors:,}</div></div>' if has_unique_visitors else ''
        return f'''
        <div class="section">
            <h2 class="section-title">Análisis de Visibilidad</h2>
            <div class="detail-grid">
                <div class="detail-card"><div class="detail-label">Visitas</div><div class="detail-value">{visits:,}</div></div>
                {visitors_card}
                <div class="detail-card"><div class="detail-label">Tiempo Promedio</div><div class="detail-value">{avg_time}</div></div>
                <div class="detail-card"><div class="detail-label">Tasa de Rebote</div><div class="detail-value">{bounce:.1f}%</div></div>
            </div>
            <h3 class="section-title" style="font-size:12px;">Páginas más visitadas</h3>
            <div class="table-container"><table><thead><tr><th>Página</th><th>Visitas</th><th>Hits</th></tr></thead><tbody>{page_rows}</tbody></table></div>
        </div>'''

    def _build_exit_pages_section(self):
        exit_pages = self.metrics_data.get(
            'exit_pages', []) if self.metrics_data else []
        if not exit_pages:
            return ""
        rows = "".join(
            f'<tr><td>{p.get("label", "")}</td><td>{p.get("nb_visits", 0)}</td><td class="text-danger">{p.get("exit_rate", 0)}%</td></tr>' for p in exit_pages[:5])
        return f'''
        <div class="section">
            <h3 class="section-title" style="font-size:12px;">Páginas con mayor abandono</h3>
            <div class="table-container"><table><thead><tr><th>Página</th><th>Visitas</th><th>Tasa de salida</th></tr></thead><tbody>{rows}</tbody></table></div>
        </div>'''

    def _build_manual_tasks_section(self):
        if not self.improved_text:
            return ""
        return f'''
        <div class="section">
            <h2 class="section-title">Optimización Proactiva</h2>
            <div class="detail-card"><div class="step-detail" style="font-size:11px;line-height:1.6;">{self.improved_text}</div></div>
        </div>'''

    def _build_images_section(self):
        if not self.antes_path and not self.despues_path:
            return ""

        from pathlib import Path

        html = '<div class="section"><h2 class="section-title">Antes & Después</h2><div class="device-grid" style="gap: 12px; margin-top: 15px;">'

        def image_html(path, label):
            if not path or not os.path.exists(path):
                return ""
            file_url = Path(os.path.abspath(path)).as_uri()
            return f"""
            <div class="device-card" style="padding: 10px; text-align: center;">
                <div style="font-size: 11px; font-weight: 700; color: var(--cyan-accent); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">{label}</div>
                <img src="{file_url}" style="max-width: 100%; max-height: 280px; object-fit: contain; border-radius: 4px; border: 1px solid rgba(0, 102, 204, 0.1);" />
            </div>"""

        if self.antes_path:
            html += image_html(self.antes_path, "ANTES")
        if self.despues_path:
            html += image_html(self.despues_path, "DESPUÉS")

        html += '</div></div>'
        return html

    # ─── GENERATE ─────────────────────────────────────────────────

    def generate(self, filename):
        now = datetime.datetime.now()
        periodo = getattr(self, 'timeframe_name',
                          f"{MESES[now.month]} {now.year}")

        template_path = os.path.join(TEMPLATE_DIR, 'executive_report.html')
        with open(template_path, 'r', encoding='utf-8') as f:
            template = f.read()

        # Replace all placeholders
        html = template.replace('{{cliente_nombre}}', self.cliente_nombre)
        html = html.replace('{{periodo}}', periodo)
        html = html.replace('{{health_cards}}', self._build_health_cards())
        html = html.replace('{{metrics_section}}',
                            self._build_metrics_section())
        html = html.replace('{{device_section}}', self._build_device_section())
        html = html.replace('{{steps_section}}', self._build_steps_section())
        html = html.replace('{{financial_section}}',
                            self._build_financial_section())
        html = html.replace('{{cta_section}}', self._build_cta_section())
        html = html.replace('{{storage_section}}',
                            self._build_storage_section())
        html = html.replace('{{maintenance_section}}',
                            self._build_maintenance_section())
        html = html.replace('{{security_section}}',
                            self._build_security_section())
        html = html.replace('{{analytics_section}}',
                            self._build_analytics_section())
        html = html.replace('{{exit_pages_section}}',
                            self._build_exit_pages_section())
        html = html.replace('{{manual_tasks_section}}',
                            self._build_manual_tasks_section())
        html = html.replace('{{images_section}}',
                            self._build_images_section())

        company_website = os.getenv('COMPANY_WEBSITE', '')
        company_website_html = f' — {company_website}' if company_website else ''
        html = html.replace('{{company_website}}', company_website_html)

        if not os.path.exists("reportes"):
            os.makedirs("reportes")

        save_path = os.path.join("reportes", filename)
        HTML(string=html).write_pdf(save_path)
        logger.info(f"HTML PDF generated: {save_path}")
        return save_path


if __name__ == "__main__":
    gen = HTMLPDFGenerator(
        "CGA",
        "Hemos optimizado el tiempo de respuesta del servidor.",
        infra_data={'site_size_gb': 3.7, 'php_version': '8.2.1', 'wp_version': '6.5'},
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
            'browsers': [
                {'label': 'Chrome', 'nb_visits': 780},
                {'label': 'Firefox', 'nb_visits': 290},
            ],
            'os_families': [
                {'label': 'Windows', 'nb_visits': 620},
                {'label': 'Android', 'nb_visits': 380},
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
    gen.generate("test_html_executive.pdf")
    print("HTML PDF generado con exito.")
