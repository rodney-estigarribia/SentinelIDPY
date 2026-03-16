# Uptime Monitor

Un script simple en Python para monitorear el uptime (disponibilidad) de tus sitios web. El script revisa una lista de URLs, y si alguna de ellas falla (devuelve un código HTTP diferente de 200 o tarda más de 10 segundos en responder), enviará una notificación a través de un bot de Telegram.

Este repositorio está preparado para ejecutarse automáticamente cada 30 minutos utilizando [GitHub Actions](https://github.com/features/actions).

## 🚀 Siguientes Pasos (Tu configuración)

Para poner a funcionar este monitor, debes seguir estos pasos:

### 1. Configurar las URLs
Abre el archivo `monitor.py` y edita la lista `URLS` (alrededor de la línea 8). Reemplaza las URLs de ejemplo y de prueba por tus 10 URLs reales que deseas monitorear.

```python
URLS = [
    "https://tusitio.com",
    "https://otro-sitio.com",
    # ...
]
```

### 2. Obtener Token y Chat ID de Telegram
Si aún no los tienes, necesitas crear un bot en Telegram para enviar las alertas:
1. Habla con [@BotFather](https://t.me/botfather) en Telegram.
2. Usa el comando `/newbot` y sigue las instrucciones. BotFather te dará un **Token** (ej: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`).
3. Envía un mensaje cualquiera a tu nuevo bot desde tu Telegram.
4. Para obtener tu **Chat ID**, visita en tu navegador: `https://api.telegram.org/bot<TU_TOKEN_AQUI>/getUpdates` y busca la propiedad `"chat": {"id": 123456789}`.

### 3. Configurar Secretos en GitHub Actions
Este paso es crucial para que GitHub Actions pueda ejecutar el script y enviar los mensajes de Telegram. **Nunca subas tus tokens directamente al código.**

1. Sube este código a tu repositorio de GitHub.
2. Ve a la pestaña **Settings** de tu repositorio.
3. En la barra lateral izquierda, despliega **Secrets and variables** y haz clic en **Actions**.
4. Haz clic en el botón verde **New repository secret**.
5. Crea un secreto con el nombre `TELEGRAM_TOKEN` y pega el token de tu bot de Telegram como valor.
6. Crea otro secreto con el nombre `TELEGRAM_CHAT_ID` y pega tu ID de chat como valor.

### 4. Listo para ejecutar ✅
Una vez configurado todo, GitHub Actions comenzará a ejecutar el script `monitor.py` cada 30 minutos automáticamente, y recibirás alertas en Telegram sólo cuando una de tus URLs esté caída.

Si deseas probarlo inmediatamente, ve a la pestaña **Actions** en tu repositorio de GitHub, selecciona el workflow **Uptime Monitor** en el menú de la izquierda y haz clic en **Run workflow**.
