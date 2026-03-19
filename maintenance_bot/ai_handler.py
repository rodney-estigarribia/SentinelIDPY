import requests
import json
import logging

logger = logging.getLogger(__name__)

class AIHandler:
    def __init__(self, host="http://host.docker.internal:11434", model="qwen2.5-coder:1.5b"):
        self.api_url = f"{host}/api/generate"
        self.model = model
        self.system_prompt = (
            "Eres un redactor experto en comunicación profesional. "
            "Convierte la nota técnica en formato directo con viñetas (bullets): "
            "1) Una línea principal en primera persona (ej: 'Mejoramos...'), 2) Bullet points de detalles. "
            "Usa voz activa SIEMPRE (ej: 'Optimizamos imágenes' NO 'Se optimizan imágenes'). "
            "Máximo 4 bullets. Mantén conciso y directo."
        )

    def improve_text(self, raw_text: str) -> str:
        """
        Envía el texto a Ollama para mejorarlo.
        Si el texto es minimal (ej: "-"), retorna un placeholder.
        Si falla (Ollama apagado o error), retorna el texto original.
        """
        # Handle minimal input (dashes, dots, etc)
        if raw_text.strip() in ["-", "--", "...", "."]:
            return "Mantenimiento preventivo completado."

        payload = {
            "model": self.model,
            "prompt": f"{self.system_prompt}\n\nNota del técnico: {raw_text}\n\nVersión mejorada:",
            "stream": False
        }

        try:
            response = requests.post(self.api_url, json=payload, timeout=15)
            response.raise_for_status()
            data = response.json()
            improved = data.get("response", "").strip()
            return improved if improved else raw_text
        except (requests.exceptions.RequestException, json.JSONDecodeError) as e:
            logger.error(f"AIHandler Error: {e}. Usando texto original.")
            return raw_text

    def improve_roadmap(self, raw_notes: str, data_context: str = "") -> str:
        """
        Convierte notas rápidas del consultor en una hoja de ruta estratégica profesional.
        Si hay data_context (de RecommendationEngine), lo combina con las notas.
        Si falla, retorna las notas originales.
        """
        if raw_notes.strip() in ["-", "--", "...", "."]:
            return "Mantenimiento preventivo completado. Continuaremos monitoreando el rendimiento."

        if data_context:
            roadmap_prompt = (
                "Actua como estratega de negocios digitales. "
                "Combina las notas del consultor con los datos de analytics para generar "
                "exactamente 3 recomendaciones claras y persuasivas. "
                "Para cada una incluye: un titulo claro, el problema con datos reales, "
                "la accion concreta, inversion estimada y retorno esperado. "
                "Formato: cada punto con guion al inicio, y los detalles indentados con: "
                "'  Problema:', '  Accion:', '  Inversion:', '  Retorno:'. "
                "Sin titulo general, solo los 3 puntos."
            )
        else:
            roadmap_prompt = (
                "Actua como estratega de negocios digitales. "
                "Toma estas notas rapidas y convertilas en exactamente 3 puntos claros, "
                "profesionales y persuasivos para una 'Hoja de Ruta Estrategica'. "
                "Usa verbos de accion y enfocate en el beneficio para el cliente. "
                "Formato: cada punto en una linea separada con guion. "
                "Maximo 3 puntos. Mantene conciso y directo. Sin titulo, solo los 3 puntos."
            )

        prompt_text = f"Notas del consultor: {raw_notes}"
        if data_context:
            prompt_text += f"\n\n{data_context}"

        payload = {
            "model": self.model,
            "prompt": f"{roadmap_prompt}\n\n{prompt_text}\n\nHoja de Ruta:",
            "stream": False
        }

        try:
            response = requests.post(self.api_url, json=payload, timeout=15)
            response.raise_for_status()
            data = response.json()
            improved = data.get("response", "").strip()
            return improved if improved else raw_notes
        except (requests.exceptions.RequestException, json.JSONDecodeError) as e:
            logger.error(f"AIHandler Roadmap Error: {e}. Usando notas originales.")
            return raw_notes

if __name__ == "__main__":
    # Prueba rápida unitaria
    handler = AIHandler(host="http://localhost:11434")
    result = handler.improve_text("Arreglé el login y optimicé las imágenes.")
    print(f"Resultado: {result}")
