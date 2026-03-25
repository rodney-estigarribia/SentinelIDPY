FROM python:3.11-slim

# Instalar dependencias del sistema para Pillow y WeasyPrint
RUN apt-get update && apt-get install -y \
    libjpeg-dev \
    zlib1g-dev \
    libglib2.0-0 \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar archivos de requerimientos e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código
COPY . .

# Crear directorio de reportes
RUN mkdir -p reportes

# Ejecutar el bot
CMD ["python", "main.py"]
