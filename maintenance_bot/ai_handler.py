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

if __name__ == "__main__":
    # Prueba rápida unitaria
    handler = AIHandler(host="http://localhost:11434")
    result = handler.improve_text("Arreglé el login y optimicé las imágenes.")
    print(f"Resultado: {result}")
