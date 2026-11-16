# 🚀 Plantilla Maestra: Mi Primera Web MiPyME Express
### Boilerplate Oficial de Sitios Satélite — Impulsos Digitales / SentinelIDPY

Esta es la plantilla base optimizada y probada para generar webs satélite de alta conversión en menos de 30 a 45 minutos para el paquete comercial **Mi Primera Web MiPyME Express** (₲610.000 / año con mano de obra bonificada).

---

## 📦 Estructura del Proyecto Satélite

```
nuevo-cliente/
├── index.html                   # Landing page principal (Lighthouse 98-100, 0 builds)
├── config.js                    # Ficha de configuración centralizada (WhatsApp, demo, precios)
├── vercel.json                  # Headers de seguridad, caché inmutable y rewrites a /portal
├── robots.txt                   # SEO seguro (auto-noindex en modo demo)
├── sitemap.xml                  # Mapa del sitio estándar
├── css/
│   ├── styles.css               # Estilos responsivos anti-slop y tokens de diseño
│   └── demo.css                 # Barra flotante del timer regresivo de 7 días
├── js/
│   ├── app.js                   # Lógica de galería, modales, FAQs y calculadora de tarifas
│   └── demo.js                  # Lógica de cuenta regresiva y bloqueo al expirar
├── images/                      # Fotografías optimizadas (WebP / JPG comprimido)
├── propuesta/
│   ├── index.html               # Pitch comparativo Antes vs Después (Google, Maps, IG, ChatGPT)
│   └── README.md                # Guía de la propuesta visual
└── WEBSITE_CREATION_FRAMEWORK.md # Guía para el agente de IA en este proyecto
```

---

## ⚡ Cómo Crear un Nuevo Sitio Satélite en 3 Pasos

### Paso 1: Clonar esta plantilla al nuevo repositorio
Desde la raíz de `SentinelIDPY`:
```bash
./scripts/create-satellite.sh mi-nuevo-cliente
```
*(O manualmente: `cp -r templates/mipyme-express/ ../mi-nuevo-cliente`)*

### Paso 2: Configurar los datos del negocio en `config.js`
Abrir `config.js` y ajustar:
- **`demo.startDate`**: Fecha de envío (formato `YYYY-MM-DD`).
- **`demo.days`**: 7 (por defecto).
- **`business`**: Nombre, ubicación, link a Google Maps, Instagram.
- **`whatsapp.phone`**: Teléfono paraguayo con código (ej. `595981...`).
- **`pricing`**: Tarifas y nombres de opciones/bungalows/servicios.

### Paso 3: Asignar imágenes y textos en `index.html` y `/propuesta`
1. Colocar las mejores fotos del prospecto en `images/`.
2. Actualizar títulos y párrafos en `index.html`.
3. Ajustar los nombres en `propuesta/index.html`.
4. Desplegar en Vercel:
   ```bash
   vercel --prod
   ```
5. Enviar el enlace de vista previa por WhatsApp con el script del SOP maestro ([sop_mipyme_express_alquileres.md](file:///Users/rod/development/GitHub/SentinelIDPY/docs/sop_mipyme_express_alquileres.md)).

---

## 🎯 Control de la Venta (Cuando el cliente paga)
Una vez que el cliente transfiere los **₲ 610.000**:
1. En `config.js`:
   ```javascript
   demo: {
     active: false, // Quita el banner y permite que Google indexe la web
     ...
   }
   ```
2. Si deseas archivar u ocultar la propuesta comercial:
   ```javascript
   proposal: {
     active: false, // Redirige /propuesta hacia el home
   }
   ```
3. Vincular el dominio propio (`.com` o `.com.py`) en Vercel.
4. Marcar en SentinelIDPY como **Cliente Real** con su correo de facturación y acceso a portal.
