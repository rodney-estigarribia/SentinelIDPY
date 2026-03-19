import os
import json
import logging
import asyncio
import uuid
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    filters,
    ContextTypes,
    ConversationHandler,
)
from ai_handler import AIHandler
from pdf_generator import PDFGenerator
from client_fetcher import ClientDataFetcher
from recommendation_engine import RecommendationEngine

# Configuración del bot
TOKEN = os.getenv("TELEGRAM_TOKEN")
if not TOKEN:
    raise ValueError("TELEGRAM_TOKEN no configurado en las variables de entorno.")

# Seguridad: Lista blanca de IDs de usuarios (como string separado por comas)
ALLOWED_USERS = [int(i.strip()) for i in os.getenv("ALLOWED_USERS", "").split(",") if i.strip()]

CLIENTS_FILE = "clientes.json"

# Estados de la conversación
INICIO, BITACORA, REVISION_IA, EDITAR_IA, CAPTURA_ANTES, CAPTURA_DESPUES, HOJA_DE_RUTA, REVISION_RUTA, EDITAR_RUTA = range(9)

# Configurar logging
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

# Instancia del manejador de IA (Ollama)
ai_handler = AIHandler()

def load_clients():
    try:
        with open(CLIENTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Manejador inicial para /revisar con verificación de usuario"""
    user_id = update.effective_user.id
    if ALLOWED_USERS and user_id not in ALLOWED_USERS:
        logger.warning(f"Intento de acceso no autorizado del ID: {user_id}")
        return ConversationHandler.END

    clients = load_clients()
    if not clients:
        await update.message.reply_text("No hay clientes configurados en el sistema.")
        return ConversationHandler.END

    keyboard = [
        [InlineKeyboardButton(c['nombre'], callback_data=str(c['id']))] for c in clients
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🛠️ *Gestión de Mantenimiento*\nSeleccione el cliente para comenzar el reporte:", 
        reply_markup=reply_markup,
        parse_mode='Markdown'
    )
    return INICIO

async def client_selected(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Captura el ID del cliente y pregunta por la bitácora."""
    query = update.callback_query
    await query.answer()
    
    client_id = int(query.data)
    clients = load_clients()
    client = next((c for c in clients if c['id'] == client_id), None)
    
    if not client:
        await query.edit_message_text("Cliente no encontrado.")
        return ConversationHandler.END

    context.user_data['client'] = client
    # Generar un ID unico para esta sesion de reporte
    context.user_data['session_id'] = uuid.uuid4().hex[:8]

    # Consultar datos del cliente (infraestructura, metricas, SSL)
    loop = asyncio.get_running_loop()
    all_data = await loop.run_in_executor(None, ClientDataFetcher.fetch_all_data, client['url'])
    infra_data = all_data.get('infrastructure', {}) if all_data else None
    metrics_data = ClientDataFetcher.extract_metrics(all_data) if all_data else None
    wordfence_data = all_data.get('wordfence', {}) if all_data else {}
    maintenance_data = all_data.get('maintenance', {}) if all_data else {}
    ssl_days = await loop.run_in_executor(None, ClientDataFetcher.obtener_dias_ssl, client['url'])
    logger.info(f"Infrastructure: {infra_data}, Metrics: {metrics_data}, SSL: {ssl_days}")
    context.user_data['infrastructure_data'] = infra_data
    context.user_data['metrics_data'] = metrics_data
    context.user_data['wordfence_data'] = wordfence_data
    context.user_data['maintenance_data'] = maintenance_data
    context.user_data['ssl_days'] = ssl_days

    await query.edit_message_text(
        f"📋 Mantenimiento para *{client['nombre']}*\n\n¿Qué mejoras manuales de SEO/Accesibilidad/Rendimiento hiciste hoy?",
        parse_mode='Markdown'
    )
    return BITACORA

async def process_bitacora(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Envía la bitácora a la IA con límites de seguridad."""
    raw_text = update.message.text
    
    # Seguridad: Límite de caracteres para evitar DoS en la IA
    if len(raw_text) > 1500:
        await update.message.reply_text("El texto es demasiado largo (max 1500 caracteres).")
        return BITACORA

    context.user_data['raw_text'] = raw_text
    
    # Notificar procesamiento
    msg = await update.message.reply_text("🧠 Optimizando el mensaje con IA...")
    
    try:
        loop = asyncio.get_running_loop()
        improved_text = await loop.run_in_executor(None, ai_handler.improve_text, raw_text)
        context.user_data['improved_text'] = improved_text
        
        keyboard = [
            [InlineKeyboardButton("✅ Correcto", callback_data="confirm_ia"),
             InlineKeyboardButton("✏️ Editar", callback_data="edit_ia"),
             InlineKeyboardButton("🔄 Usar Original", callback_data="use_raw")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await msg.edit_text(
            f"✨ *Sugerencia Profesional:*\n\n{improved_text}\n\n¿Le parece bien este texto?",
            parse_mode='Markdown',
            reply_markup=reply_markup
        )
        return REVISION_IA
    except Exception as e:
        logger.error(f"Error procesando bitacora: {e}")
        context.user_data['final_text'] = raw_text
        await msg.edit_text("⚠️ Error con la IA. Usando texto original.")
        await update.message.reply_text("📸 Por favor, carga una foto del *ANTES* o envía /skip.", parse_mode='Markdown')
        return CAPTURA_ANTES

async def confirm_ia(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    if query.data == "use_raw":
        context.user_data['final_text'] = context.user_data['raw_text']
        await query.edit_message_text("Usando texto original.")
    elif query.data == "edit_ia":
        await query.edit_message_text(
            f"✏️ Enviame tu version corregida del texto.\n\nTexto actual de IA:\n_{context.user_data['improved_text']}_",
            parse_mode='Markdown'
        )
        return EDITAR_IA
    else:
        context.user_data['final_text'] = context.user_data['improved_text']
        await query.edit_message_text("Texto optimizado aceptado.")

    await query.message.reply_text(
        "📸 Por favor, carga una foto del *ANTES* o envía /skip para saltar.",
        parse_mode='Markdown'
    )
    return CAPTURA_ANTES

async def handle_edit_ia(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Recibe el texto corregido por el usuario."""
    context.user_data['final_text'] = update.message.text
    await update.message.reply_text("Texto corregido aceptado.")
    await update.message.reply_text(
        "📸 Por favor, carga una foto del *ANTES* o envía /skip para saltar.",
        parse_mode='Markdown'
    )
    return CAPTURA_ANTES

async def handle_photo_antes(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Guarda la foto del antes con nombre unico."""
    photo_file = await update.message.photo[-1].get_file()
    session_id = context.user_data['session_id']
    path = f"reportes/tmp_{session_id}_antes.jpg"
    await photo_file.download_to_drive(path)
    context.user_data['antes_img'] = path
    
    await update.message.reply_text("✅ Recibida. Envía la foto del *DESPUÉS* o /skip.", parse_mode='Markdown')
    return CAPTURA_DESPUES

async def skip_antes(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['antes_img'] = None
    await update.message.reply_text("Saltado. Envía la foto del *DESPUÉS* o /skip.")
    return CAPTURA_DESPUES

async def handle_photo_despues(update: Update, context: ContextTypes.DEFAULT_TYPE):
    photo_file = await update.message.photo[-1].get_file()
    session_id = context.user_data['session_id']
    path = f"reportes/tmp_{session_id}_desp.jpg"
    await photo_file.download_to_drive(path)
    context.user_data['despues_img'] = path
    return await ask_hoja_de_ruta(update, context)

async def skip_despues(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['despues_img'] = None
    return await ask_hoja_de_ruta(update, context)

async def ask_hoja_de_ruta(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Pregunta al consultor por recomendaciones estratégicas."""
    client_name = context.user_data['client']['nombre']
    await update.message.reply_text(
        f"Para cerrar el reporte: Que recomendaciones estrategicas o proximos pasos sugeris para *{client_name}* este mes?\n\n(Escribi tips rapidos o /skip para omitir)",
        parse_mode='Markdown'
    )
    return HOJA_DE_RUTA

async def process_hoja_de_ruta(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Procesa las notas de hoja de ruta con IA."""
    raw_notes = update.message.text

    if len(raw_notes) > 1500:
        await update.message.reply_text("El texto es demasiado largo (max 1500 caracteres).")
        return HOJA_DE_RUTA

    context.user_data['raw_roadmap'] = raw_notes
    msg = await update.message.reply_text("Profesionalizando recomendaciones con IA...")

    try:
        # Generate data-driven recommendations from metrics
        metrics = context.user_data.get('metrics_data')
        data_recs = RecommendationEngine.generate(metrics) if metrics else []
        data_context = RecommendationEngine.format_for_prompt(data_recs)
        context.user_data['data_recommendations'] = data_recs

        loop = asyncio.get_running_loop()
        improved_roadmap = await loop.run_in_executor(None, ai_handler.improve_roadmap, raw_notes, data_context)
        context.user_data['improved_roadmap'] = improved_roadmap

        keyboard = [
            [InlineKeyboardButton("✅ Correcto", callback_data="confirm_ruta"),
             InlineKeyboardButton("✏️ Editar", callback_data="edit_ruta"),
             InlineKeyboardButton("🔄 Usar Original", callback_data="use_raw_ruta")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await msg.edit_text(
            f"✨ *Proximos pasos sugeridos:*\n\n{improved_roadmap}\n\n¿Te parece bien?",
            parse_mode='Markdown',
            reply_markup=reply_markup
        )
        return REVISION_RUTA
    except Exception as e:
        logger.error(f"Error procesando hoja de ruta: {e}")
        context.user_data['hoja_de_ruta'] = raw_notes
        await msg.edit_text("Error con IA. Usando notas originales.")
        return await generate_report(update, context)

async def confirm_ruta(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Confirma o edita la hoja de ruta."""
    query = update.callback_query
    await query.answer()

    if query.data == "use_raw_ruta":
        context.user_data['hoja_de_ruta'] = context.user_data['raw_roadmap']
        await query.edit_message_text("Usando notas originales.")
        return await generate_report(query, context)
    elif query.data == "edit_ruta":
        await query.edit_message_text(
            f"✏️ Enviame tu version corregida.\n\nTexto actual de IA:\n_{context.user_data['improved_roadmap']}_",
            parse_mode='Markdown'
        )
        return EDITAR_RUTA
    else:
        context.user_data['hoja_de_ruta'] = context.user_data['improved_roadmap']
        await query.edit_message_text("Proximos pasos aceptados.")
        return await generate_report(query, context)

async def handle_edit_ruta(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Recibe la hoja de ruta corregida por el usuario."""
    context.user_data['hoja_de_ruta'] = update.message.text
    await update.message.reply_text("Proximos pasos corregidos aceptados.")
    return await generate_report(update, context)

async def skip_hoja_de_ruta(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['hoja_de_ruta'] = None
    return await generate_report(update, context)

async def generate_report(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = await update.message.reply_text("Generando reporte...")

    client = context.user_data['client']
    text = context.user_data['final_text']
    antes = context.user_data.get('antes_img')
    despues = context.user_data.get('despues_img')
    infra_data = context.user_data.get('infrastructure_data')
    ssl_days = context.user_data.get('ssl_days')
    hoja_de_ruta = context.user_data.get('hoja_de_ruta')
    metrics_data = context.user_data.get('metrics_data')
    wordfence_data = context.user_data.get('wordfence_data', {})
    maintenance_data = context.user_data.get('maintenance_data', {})
    logger.info(f"Generating report - infra: {infra_data}, ssl: {ssl_days}, metrics: {metrics_data}")
    pdf_path = None

    try:
        # Sanitizar nombre del cliente para evitar Path Traversal
        safe_name = "".join(c for c in client['nombre'] if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_')
        pdf_gen = PDFGenerator(client['nombre'], text, antes, despues, infra_data, ssl_days, hoja_de_ruta, metrics_data, wordfence_data, maintenance_data)
        logger.info(f"PDFGenerator initialized with infra_data: {pdf_gen.infra_data}, ssl_days: {pdf_gen.ssl_days}")
        filename = f"Reporte_{safe_name}_{uuid.uuid4().hex[:6]}.pdf"
        
        loop = asyncio.get_running_loop()
        pdf_path = await loop.run_in_executor(None, pdf_gen.generate, filename)
        
        await update.message.reply_document(
            document=open(pdf_path, 'rb'),
            filename=filename,
            caption=f"✅ Reporte para *{client['nombre']}* generado con éxito.",
            parse_mode='Markdown'
        )

    except Exception as e:
        logger.error(f"Error generando PDF: {e}")
        await update.message.reply_text("❌ Hubo un error crítico al generar el reporte.")

    finally:
        # Limpieza robusta en bloque finally
        for p in [antes, despues]:
            if p and os.path.exists(p):
                try:
                    os.remove(p)
                    # Tambien limpiar webps generados por PDFGenerator
                    wp = p.rsplit('.', 1)[0]
                    for f in os.listdir("reportes") if os.path.exists("reportes") else []:
                        if f.startswith(os.path.basename(wp)) and f.endswith(".webp"):
                            os.remove(os.path.join("reportes", f))
                except Exception as e:
                    logger.warning(f"No se pudo limpiar archivo temporal {p}: {e}")

    await msg.delete()
    return ConversationHandler.END

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Operación cancelada.")
    return ConversationHandler.END

def main():
    app = Application.builder().token(TOKEN).build()

    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('review', start)],
        states={
            INICIO: [CallbackQueryHandler(client_selected)],
            BITACORA: [MessageHandler(filters.TEXT & ~filters.COMMAND, process_bitacora)],
            REVISION_IA: [CallbackQueryHandler(confirm_ia)],
            EDITAR_IA: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_edit_ia)],
            CAPTURA_ANTES: [
                MessageHandler(filters.PHOTO, handle_photo_antes),
                CommandHandler('skip', skip_antes)
            ],
            CAPTURA_DESPUES: [
                MessageHandler(filters.PHOTO, handle_photo_despues),
                CommandHandler('skip', skip_despues)
            ],
            HOJA_DE_RUTA: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, process_hoja_de_ruta),
                CommandHandler('skip', skip_hoja_de_ruta)
            ],
            REVISION_RUTA: [CallbackQueryHandler(confirm_ruta)],
            EDITAR_RUTA: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_edit_ruta)],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
    )

    app.add_handler(conv_handler)
    print("Bot activo. Usa /review para comenzar...")
    app.run_polling()

if __name__ == "__main__":
    main()
