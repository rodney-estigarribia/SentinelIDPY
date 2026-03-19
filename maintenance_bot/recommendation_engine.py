import logging

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """Generates data-driven recommendations with ROI from analytics metrics."""

    @staticmethod
    def _get_mobile_bounce(metrics):
        """Extract mobile bounce rate from devices data."""
        for dev in metrics.get('devices', []):
            label = dev.get('label', '').lower()
            if 'mobile' in label or 'smart' in label or 'phone' in label:
                return dev.get('bounce_rate', 0), dev.get('nb_visits', 0)
        return 0, 0

    @staticmethod
    def _get_top_exit(metrics):
        """Get the page with highest exit rate."""
        exit_pages = metrics.get('exit_pages', [])
        if not exit_pages:
            return None
        return max(exit_pages, key=lambda p: p.get('exit_rate', 0))

    @staticmethod
    def generate(metrics_data):
        """Analyze metrics and return up to 3 structured recommendations."""
        if not metrics_data:
            return []

        recommendations = []

        # Rule 1: High mobile bounce rate
        mobile_bounce, mobile_visits = RecommendationEngine._get_mobile_bounce(metrics_data)
        if mobile_bounce > 50 and mobile_visits > 0:
            target_bounce = 45
            recovered = int(mobile_visits * (mobile_bounce - target_bounce) / 100)
            recommendations.append({
                'title': f'Reducir bounce rate en mobile ({mobile_bounce:.0f}%)',
                'problem': f'{mobile_visits:,} visitantes moviles/mes, {mobile_bounce:.0f}% se va sin interactuar',
                'action': 'Auditoria UX/UI + Rediseno responsive',
                'investment': 'Gs. 1.500.000',
                'roi': f'Si reducimos a {target_bounce}%, ganamos +{recovered} visitantes que convierten',
                'priority': 1,
            })

        # Rule 2: High exit rate on key page
        top_exit = RecommendationEngine._get_top_exit(metrics_data)
        if top_exit and top_exit.get('exit_rate', 0) > 50:
            exit_rate = top_exit['exit_rate']
            exit_visits = top_exit.get('nb_visits', 0)
            exit_count = int(exit_visits * exit_rate / 100)
            page_label = top_exit.get('label', '/pagina')
            recover_target = 20
            recovered = int(exit_count * recover_target / 100)
            recommendations.append({
                'title': f'Reducir abandono en {page_label} ({exit_rate}%)',
                'problem': f'De {exit_visits:,} visitas, {exit_count:,} se van sin completar',
                'action': 'Simplificar flujo + agregar recuperacion de carrito',
                'investment': 'Gs. 300.000',
                'roi': f'Si recuperamos {recover_target}%, ganamos +{recovered} conversiones/mes',
                'priority': 2,
            })

        # Rule 3: General high bounce rate
        bounce_rate = metrics_data.get('bounce_rate', 0)
        visitors = metrics_data.get('nb_uniq_visitors', 0)
        if bounce_rate > 40 and visitors > 0:
            target = 35
            retained = int(visitors * (bounce_rate - target) / 100)
            recommendations.append({
                'title': f'Reducir tasa de rebote general ({bounce_rate:.1f}%)',
                'problem': f'Rebote del {bounce_rate:.1f}% - por encima del objetivo (35%)',
                'action': 'Mejorar contenido y llamadas a la accion en paginas principales',
                'investment': 'Gs. 500.000',
                'roi': f'Retener +{retained} visitantes mas por mes',
                'priority': 3,
            })

        # Rule 4: No conversions configured
        if metrics_data.get('conversions') is None:
            recommendations.append({
                'title': 'Configurar seguimiento de conversiones',
                'problem': 'No se miden leads ni compras actualmente',
                'action': 'Configurar metas en Matomo para medir leads, compras y clicks en CTA',
                'investment': 'Gs. 200.000',
                'roi': 'Medir impacto real de cada mejora en terminos de negocio',
                'priority': 4,
            })

        # Sort by priority, return top 3
        recommendations.sort(key=lambda r: r['priority'])
        return recommendations[:3]

    @staticmethod
    def format_for_prompt(recommendations):
        """Format recommendations as text for AI prompt context."""
        if not recommendations:
            return ""

        lines = ["Recomendaciones basadas en datos del sitio:"]
        for i, rec in enumerate(recommendations, 1):
            lines.append(f"\n{i}. {rec['title']}")
            lines.append(f"   Problema: {rec['problem']}")
            lines.append(f"   Accion: {rec['action']}")
            lines.append(f"   Inversion: {rec['investment']}")
            lines.append(f"   Retorno: {rec['roi']}")

        return "\n".join(lines)

    @staticmethod
    def format_for_pdf(recommendations):
        """Format recommendations as structured text for PDF rendering."""
        if not recommendations:
            return ""

        lines = []
        for rec in recommendations:
            lines.append(f"- {rec['title']}")
            lines.append(f"  Problema: {rec['problem']}")
            lines.append(f"  Accion: {rec['action']}")
            lines.append(f"  Inversion: {rec['investment']}")
            lines.append(f"  Retorno: {rec['roi']}")

        return "\n".join(lines)


if __name__ == "__main__":
    # Test with mock data
    mock_metrics = {
        'nb_uniq_visitors': 870,
        'bounce_rate': 42.5,
        'devices': [
            {'label': 'Desktop', 'nb_visits': 650, 'bounce_rate': 28.0},
            {'label': 'Smartphone', 'nb_visits': 540, 'bounce_rate': 58.0},
        ],
        'exit_pages': [
            {'label': '/carrito', 'nb_visits': 180, 'exit_rate': 67},
            {'label': '/pago', 'nb_visits': 120, 'exit_rate': 54},
        ],
        'conversions': None,
    }

    recs = RecommendationEngine.generate(mock_metrics)
    print("=== Recommendations ===")
    for r in recs:
        print(f"\n{r['title']}")
        print(f"  {r['problem']}")
        print(f"  {r['action']}")
        print(f"  {r['investment']}")
        print(f"  {r['roi']}")

    print("\n=== For AI Prompt ===")
    print(RecommendationEngine.format_for_prompt(recs))

    print("\n=== For PDF ===")
    print(RecommendationEngine.format_for_pdf(recs))
