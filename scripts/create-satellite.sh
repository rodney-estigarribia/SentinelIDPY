#!/usr/bin/env bash
# ==============================================================================
# create-satellite.sh — Impulsos Digitales / SentinelIDPY
# Clona la plantilla oficial de Mi Primera Web MiPyME Express a un nuevo proyecto
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
TEMPLATE_DIR="$ROOT_DIR/templates/mipyme-express"

if [ -z "$1" ]; then
  echo "❌ Error: Debes especificar el nombre de la carpeta para el nuevo proyecto satélite."
  echo "Uso: ./scripts/create-satellite.sh <nombre-del-proyecto>"
  echo "Ejemplo: ./scripts/create-satellite.sh quinta-los-abuelos"
  exit 1
fi

PROJECT_NAME="$1"

# Si la ruta proporcionada es absoluta o relativa, usarla; si es solo un nombre, crear en ~/development/GitHub/
if [[ "$PROJECT_NAME" == /* ]] || [[ "$PROJECT_NAME" == ./* ]] || [[ "$PROJECT_NAME" == ../* ]]; then
  TARGET_DIR="$PROJECT_NAME"
else
  TARGET_DIR="$(dirname "$ROOT_DIR")/$PROJECT_NAME"
fi

if [ -d "$TARGET_DIR" ]; then
  echo "⚠️ La carpeta '$TARGET_DIR' ya existe."
  read -p "¿Deseas sobrescribir o copiar los archivos base dentro de ella? (s/n): " CONFIRM
  if [[ "$CONFIRM" != "s" && "$CONFIRM" != "S" ]]; then
    echo "Operación cancelada."
    exit 0
  fi
else
  mkdir -p "$TARGET_DIR"
fi

echo "🚀 Creando nuevo sitio satélite en: $TARGET_DIR"
echo "📦 Copiando plantilla base desde: $TEMPLATE_DIR"

cp -R "$TEMPLATE_DIR/"* "$TARGET_DIR/"
cp -R "$TEMPLATE_DIR/".[!.]* "$TARGET_DIR/" 2>/dev/null || true

# Inicializar git si no existe
if [ ! -d "$TARGET_DIR/.git" ]; then
  cd "$TARGET_DIR"
  git init -b main >/dev/null 2>&1 || git init >/dev/null 2>&1
  echo "🌿 Repositorio Git inicializado en $TARGET_DIR"
fi

echo ""
echo "========================================================================"
echo "✅ ¡Sitio satélite listo en: $TARGET_DIR"
echo "========================================================================"
echo "Pasos siguientes:"
echo " 1. cd $TARGET_DIR"
echo " 2. Abre Antigravity en esa carpeta y pásale las fotos/datos del prospecto."
echo " 3. Edita 'config.js' (WhatsApp, startDate de la demo, tarifas y nombre)."
echo " 4. Despliega en Vercel con: vercel --prod"
echo "========================================================================"
