# SOP Maestro: Mi Primera Web MiPyME Express 🏡
### Nicho Piloto: Alquileres Temporales, Quintas, Cabañas & Bungalows
**Impulsos Digitales / SentinelIDPY**  
*Documento de Procedimiento Operativo Estándar (SOP)*  
*Objetivo:* Prospección en frío, ensamblado ultrarrápido con IA y cierre comercial con el modelo de escasez (7 días).

---

## 🎯 Resumen de la Oferta y Stack Estándar

* **Ticket Frontal:** **₲ 610.000 / año** (Cubre dominio `.com` o `.com.py`, hosting de borde ultrarrápido en Vercel, certificados SSL, mantenimiento base y seguridad).
* **Gancho / Ancla:** Mano de obra de diseño y desarrollo **100% bonificada** por lanzamiento (Valor percibido de lista: ₲ 1.200.000).
* **Tiempo Máximo de Producción:** **< 30 a 45 minutos** por prospecto (usando la arquitectura de componentes probada en `cabana-del-arbol`).
* **Stack Tecnológico Estándar:** **Vanilla HTML5 + CSS3 + JavaScript puro + `config.js`**
  * *¿Por qué NO Next.js para este servicio?:* La arquitectura estática pura tiene 0 segundos de build, 0 vulnerabilidades de paquetes Node, 0 rotura de dependencias con el tiempo, puntaje Lighthouse 98-100 nativo y hosting 100% gratuito en Vercel sin límites de funciones serverless.
* **Regla de Cierre:** Enlace de prueba con cuenta regresiva de **7 días**. Si no se confirma el pago, la web y la propuesta se bloquean automáticamente.

---

## 🏛️ Los Tres Pilares Clave Obligatorios

Cada nuevo proyecto que se genere **debe incluir desde el inicio** estos tres componentes sin necesidad de prompts adicionales:

### Pilar 1: El Sistema de Demo & Cuenta Regresiva (7 Días)
* **Control Centralizado en `config.js`:**
  ```javascript
  demo: {
    active: true,       // false al cobrar para quitar el banner y habilitar Google
    startDate: "2026-09-23", // Día en que se envía el mensaje
    days: 7             // Vigencia de la prueba
  }
  ```
* **Comportamiento Automático (`css/demo.css` + `js/demo.js`):**
  1. **Barra Superior Fija:** Muestra el contador en vivo: *"Vista previa de tu nueva web · Disponible por Xd Xh Xm Xs"*.
  2. **Bloqueo Preventivo en `<head>`:** Si `isDemoExpired()` es true, oculta el contenido antes de pintarlo para evitar parpadeos.
  3. **Pantalla de Expiración:** Al llegar a cero, reemplaza el contenido por:  
     *"Esta vista previa ha finalizado. La demo estuvo disponible por 7 días. Para reactivarla, contactá a Impulsos Digitales"*.
  4. **Protección SEO:** Inyecta automáticamente `<meta name="robots" content="noindex, nofollow">` mientras `demo.active` sea true.

### Pilar 2: La Propuesta Comparativa Antes/Después (`/propuesta`)
Se publica en la ruta `/propuesta` (`https://[negocio]-demo.vercel.app/propuesta`) y comparte el mismo contador de 7 días.
Compara 4 frentes visuales (en versión Computadora y Celular):
1. **Google Search:** Hoy (aparece otro negocio o enlaces sueltos) vs. Propuesta (web oficial en #1 con enlaces directos a tarifas y preguntas frecuentes).
2. **Google Maps:** Hoy (sin pin propio o fichas confusas) vs. Propuesta (Perfil de Empresa con fotos, servicios, botón llamar y enlace web).
3. **Instagram:** Auditoría y sugerencias listas para copiar (nombre con palabras clave buscables, categoría adecuada, biografía optimizada, botón WhatsApp y destacadas).
4. **SEO & GEO (Búsqueda con IA & WhatsApp):**
   * **Vista previa de WhatsApp:** Tarjeta enriquecida con foto de portada y descripción al compartir el link.
   * **Simulación Auténtica de ChatGPT Search:** Captura móvil con la interfaz real de ChatGPT (logotipo oficial, pill *"Buscó en la web: [búsqueda]"*, recomendación persuasiva del negocio y tarjeta de cita oficial `[ 🌐 minegocio.com.py 1 ]`).
5. **Pie de Página Institucional:** Con crédito y enlace a `https://impulsosdigitales.com.py/`.

### Pilar 3: Telemetría y Portal de Clientes Centralizado Multi-Tenant (`/portal`)
Se proyecta en la ruta `/portal` (`https://[negocio].com.py/portal` o `https://[negocio]-demo.vercel.app/portal`) con **cero líneas de código o archivos HTML locales en el repositorio del cliente**.
* **Arquitectura de Mantenimiento Cero (Single Source of Truth):**
  * El motor del portal reside al 100% en `SentinelIDPY` (`dashboard/src/app/portal/[slug]`).
  * La web del cliente solo incluye reglas de `rewrites` en `vercel.json` que proyectan la ruta central de forma transparente manteniendo el dominio propio del cliente.
  * Si mañana se añade una mejora (ej. gráficos avanzados, exportar PDF, filtros de fecha), se actualiza una sola vez en SentinelIDPY y **el 100% de los clientes la reciben al instante**.
* **Telemetría Ligera en Vivo:**
  * Script liviano en `<head>`: `<script src="https://idpy-admin.vercel.app/telemetry.js" data-site="[slug]" defer></script>`.
  * Rastrea visitas únicas, clics en el botón de WhatsApp (conversión directa), dispositivo y ciudades sin cookies invasivas.
* **Seguridad y Acceso Magic Link por Correo:**
  * Login sin contraseñas: El cliente ingresa su correo registrado y recibe un Magic Link firmado con HMAC (vigencia de 7 días) entregado por Resend.
  * Sin tokens visibles en pantalla ni enlaces directos vulnerables en la respuesta de la API.
  * **Experiencia de Entrada Suave:** Al pulsar el enlace del correo, no parpadea el formulario de login; entra directamente una tarjeta con spinner animado (*"Accediendo... Validando tu enlace de acceso seguro"* con umbral visual de 450ms) y despliega el tablero de estadísticas.

---

## 🗺️ Flujo Operativo en 5 Fases

```
[Fase 1: Cacería en Frío] ──► Detectar 3-5 quintas en Sanber/Altos/Cordillera sin web
           │
[Fase 2: Extracción IA]  ──► Descargar fotos de IG/FB, precios de WhatsApp, ubicación
           │
[Fase 3: Ensamblado 24h] ──► Clonar plantilla estática + config.js + propuesta + Deploy
           │
[Fase 4: El Envío 7 Días]──► Mensaje de preview con escasez (demo + propuesta)
           │
[Fase 5: Cobro & Upsell] ──► Transferencia ₲ 610.000 + Dominio oficial + Pregunta de dolor
```

---

## 🔍 Fase 1: Cacería de Candidatos (15 a 20 min)

### Dónde buscar:
1. **Instagram:** Hashtags `#alquilerquinta`, `#quintaspy`, `#sanbernardinopy`, `#posadaparaguay`, `#cabañasparaguay`, `#cordillerapy`.
2. **Facebook Marketplace & Grupos:** "Alquiler de quintas en San Bernardino y alrededores".
3. **Google Maps:** Buscar *"quintas en alquiler cerca de San Bernardino"*. Detectar aquellas con buenas fotos pero sin botón de "Sitio web" o cuya búsqueda arroja el negocio de un competidor.

### Criterio de Selección (El perfil ideal):
* [x] Tienen fotos de buena calidad (piscina, quincho, habitaciones).
* [x] Activos en el último mes.
* [x] Enlace de WhatsApp en la biografía, **pero sin sitio web propio**.
* [x] Tarifa por noche/estadía $\ge$ ₲ 600.000 (1 sola reserva paga el año).

---

## 📸 Fase 2: Extracción Rápida de Datos (10 min)

Sin pedirle nada al dueño previamente, recolectar:
1. **Nombre comercial y Logotipo / Avatar**.
2. **6 a 10 Fotos destacadas:** Fachada, piscina, quincho/asador, habitaciones, jacuzzi, atardecer.
3. **Comodidades básicas:** Climatización, wifi, estacionamiento, desayuno, pet friendly.
4. **Número de WhatsApp comercial** y enlace actual de Google Maps (o pin).
5. **Capturas del "Antes":** Captura de su perfil de Instagram, búsqueda actual en Google Search y Google Maps.

---

## ⚡ Fase 3: Ensamblado y Despliegue Express (25 a 35 min)

### 1. Parametrización Total vía `config.js`:
Nunca se hardcodean números, textos de botones ni precios en el HTML. Todo se centraliza en `config.js`:
```javascript
const SITE_CONFIG = {
  demo: {
    active: true,
    startDate: "2026-09-23", // Cambiar al día de envío del mensaje
    days: 7,
  },
  business: {
    name: "Quinta Los Lapachos",
    tagline: "Tu refugio privado a orillas del lago",
    description: "Una experiencia de descanso exclusivo y naturaleza.",
    location: "San Bernardino, Cordillera — Paraguay",
    locationLink: "https://maps.google.com/...",
    instagram: "https://www.instagram.com/quinta_lapachos/",
    checkin: "12:00 hs",
    checkout: "12:00 hs",
    currency: "Gs.",
  },
  whatsapp: {
    phone: "595981123456",
    defaultMessage: "¡Hola! Vi la web y quisiera consultar disponibilidad...",
    reservationMessage: "¡Hola! Vi la web y quiero consultar disponibilidad para reservar...",
    cabanaMessage: "¡Hola! Quisiera reservar la opción Cabaña en las siguientes fechas: ...",
    casonaMessage: "¡Hola! Quisiera reservar la opción Grupal en las siguientes fechas: ..."
  },
  pricing: {
    opcion1: { name: "La Cabaña", subtitle: "Parejas", weekday: "1.300.000", weekend: "1.500.000", note: "Incluye desayuno" },
    opcion2: { name: "La Casona", subtitle: "Grupal", night: "2.500.000", note: "Incluye desayuno" }
  },
  features: [ ... ]
};
```

### 2. Generación de la Propuesta (`/propuesta`):
1. Colocar las capturas originales en `propuesta/antes/`.
2. Generar las simulaciones en `propuesta/fuentes/` ejecutando:
   ```bash
   python3 build.py
   node render.mjs google-maps-desktop:1440:900:2 google-maps-mobile:402:874:3 \
     google-search-desktop:1440:1000:2 google-search-mobile:402:900:3 \
     instagram-desktop:1440:1082:2 instagram-mobile:402:874:3 \
     whatsapp-preview:402:720:3 asistente-ia:402:720:3
   ```
3. Convertir las imágenes a JPG livianas en `propuesta/web/despues/` vía `sips`:
   ```bash
   sips -s format jpeg -s formatOptions 85 propuesta/despues/*.png --out propuesta/web/despues/
   ```

### 3. Configuración del Portal de Clientes y Telemetría Centralizada (2 min):
Cada nueva web debe conectarse al motor centralizado de `SentinelIDPY` sin crear carpetas de portal locales:

1. **Inyectar el Tracker en `index.html` (dentro de `<head>`):**
   ```html
   <!-- Telemetría Ligera SentinelIDPY -->
   <script src="https://idpy-admin.vercel.app/telemetry.js" data-site="[slug-cliente]" defer></script>
   ```
2. **Configurar la Proyección en `vercel.json`:**
   En el archivo `vercel.json` de la raíz del proyecto, agregar la regla de `rewrites`:
   ```json
   "rewrites": [
     {
       "source": "/portal",
       "destination": "https://idpy-admin.vercel.app/portal/[slug-cliente]"
     },
     {
       "source": "/portal/(.*)",
       "destination": "https://idpy-admin.vercel.app/portal/[slug-cliente]/$1"
     },
     {
       "source": "/_next/(.*)",
       "destination": "https://idpy-admin.vercel.app/_next/$1"
     },
     {
       "source": "/api/portal/(.*)",
       "destination": "https://idpy-admin.vercel.app/api/portal/$1"
     }
   ]
   ```
3. **Dar de alta en el Dashboard SentinelIDPY:**
   Cargar el cliente en el CRM o base de datos con su `slug` (ej: `hotel-los-lagos`), nombre del negocio y correo autorizado para recibir el Magic Link.

### 4. Despliegue en Vercel:
* `vercel --prod`
* Subdominio: `https://[nombre-negocio]-demo.vercel.app`
* Verificar carga en celular:
  * `/` (Web principal)
  * `/propuesta` (Comparativa antes/después)
  * `/portal` (Portal de clientes proyectado con telemetría en vivo)

---

## 📲 Fase 4: La Secuencia de Mensajes y Cierre (7 Días)

### Mensaje 1: El Permiso para enviar el preview (WhatsApp o DM)
> *"¡Hola [Nombre o Equipo de Quinta XYZ]! 👋 ¿Cómo están?  
> Estuve mirando sus fotos y el espacio hermoso que tienen en [San Bernardino/Altos].  
> Noté que no contaban con un sitio web oficial para que los huéspedes vean las fotos en alta calidad, las comodidades y puedan consultar disponibilidad sin dar tantas vueltas en WhatsApp.  
> Por iniciativa propia y para sumarles valor, les preparé un prototipo funcional junto con una propuesta visual de cómo mejorar su presencia en Google e Instagram, para que lo miren sin ningún compromiso.  
> ¿Está bien si les paso el link para que le den una mirada?"*

---

### Mensaje 2: La Entrega con Escasez (Al responder afirmativamente)
> *"¡Buenísimo! Aquí les dejo los accesos de prueba:  
> 🌐 **La Web en funcionamiento:** `https://[negocio]-demo.vercel.app`  
> 📊 **La Propuesta (Antes y Después en Google, Maps, Instagram y ChatGPT):** `https://[negocio]-demo.vercel.app/propuesta`  
> *(Les recomiendo abrir ambos desde el celular que es donde navega la mayoría de los huéspedes)*.  
> 
> ⏳ **Una nota importante:** El prototipo está montado en un servidor temporal de prueba y estará activo durante los próximos **7 días**.  
> 
> Si les gusta y quieren dejarlo activo de forma definitiva con su propio dominio oficial (`.com.py` o `.com`), el trabajo completo de diseño y programación (que normalmente cobramos ₲ 1.200.000) se lo dejamos **100% bonificado**.  
> 
> Solo tendrían que cubrir el costo de mantenimiento del servidor, seguridad y dominio por **₲ 610.000 al año** (que equivale a solo ₲ 50.800 al mes).  
> 
> Mírenlo con calma y si les sirve para potenciar sus reservas, me avisan y coordinamos el alta oficial."*

---

### Mensaje 3: Seguimiento al Día 4 (Si no respondieron)
> *"¡Hola [Nombre]! 👋 Quería consultarles si tuvieron oportunidad de ver la web y la comparativa de [Nombre del Negocio].  
> Como la demo temporal vence en 3 días, quería saber si les interesaría conservarla o si tienen alguna consulta sobre la ficha de Google Maps o el botón de reservas directas a su WhatsApp. ¡Quedo a las órdenes!"*

---

### Mensaje 4: El Cierre y Activación (Cuando aceptan)
> *"¡Excelente decisión! 🚀 Vamos a dejarla impecable y oficial.  
> Para registrar el dominio a su nombre y migrar la web al servidor definitivo, les comparto los datos de transferencia por los ₲ 610.000:  
> 
> 🏦 **Banco Itaú Paraguay**  
> * Titular: [Rodney / Impulsos Digitales]  
> * Cuenta: [Número de cuenta]  
> * C.I. / RUC: [Número]  
> 
> Apenas me envíen el comprobante, conectamos el dominio propio, damos de alta su ficha en Google Maps y les entrego el enlace oficial listo para colocar en la biografía de su Instagram."*

---

## 💎 Fase 5: Entrega Final y Disparo del Upsell Recurrente

Una vez que pagaron los ₲ 610.000:
1. En `config.js`: poner `demo.active: false` (el banner desaparece y Google indexa el sitio).
2. Conectar el dominio definitivo en Vercel.
3. Crear el Perfil de Empresa en Google Maps.
4. Aplicar los textos sugeridos en su biografía de Instagram.
5. **La Pregunta Guiada (Detección del dolor):**
   > *"¡Ya está tu web 100% activa en tu dominio oficial! 🎉  
   > Para ayudarte a vender más: de estas 3 cosas en tu día a día, ¿cuál es la que más tiempo te hace perder?:  
   > 1. Que te pidan fotos y precios por WhatsApp y después te dejen en visto.  
   > 2. Coordinar fechas de reservas y que se te superpongan o se olviden de confirmar la seña.  
   > 3. Que te cueste conseguir reseñas de 5 estrellas en Google Maps."*

---

## 🔮 Hoja de Ruta Tecnológica: Analítica y Gestión de CTAs

Para evolucionar este modelo sin sobrecargar de costos ni complejidad técnica:

### 1. Evolución de la Parametrización de CTAs:
* **Etapa 1 (Actual):** Archivo central `config.js` en el repositorio local. Cambios en 30 segundos vía git.
* **Etapa 2 (Panel Admin SentinelIDPY):** Vista en `/clients` para inspeccionar y actualizar los valores de `config.js` de cada cliente desde el panel central.
* **Etapa 3 (Portal de Autoservicio del Cliente):** Pantalla sencilla donde el cliente puede modificar su teléfono de WhatsApp, precios y horarios sin tocar código.

### 2. Arquitectura del Portal Centralizado Multi-Tenant (Implementado & Operativo):

```mermaid
flowchart TD
    subgraph Clientes ["Webs Satélites de Clientes (Vercel)"]
        C1["cabanadelarbol.com.py/portal"]
        C2["terrazasbungalow.com.py/portal"]
        C3["donmendoza.com.py/portal"]
        CN["[futuro-cliente].com.py/portal"]
    end

    subgraph Core ["Motor Central SentinelIDPY (idpy-admin.vercel.app)"]
        Router["/portal/[slug] (Next.js Dynamic Route)"]
        UI["PortalClient (React + Tailwind + Lucide)"]
        Auth["Magic Link Engine (HMAC SHA-256 / 7 Días)"]
        Resend["Despacho Transaccional Resend"]
        DB[(Neon Serverless Postgres)]
    end

    C1 -->|"Vercel Rewrite (Transparente)"| Router
    C2 -->|"Vercel Rewrite (Transparente)"| Router
    C3 -->|"Vercel Rewrite (Transparente)"| Router
    CN -->|"Vercel Rewrite (Transparente)"| Router
    Router --> UI
    UI --> Auth
    Auth --> Resend
    UI --> DB
```

#### Regla de Oro: Mantenimiento Cero en Clientes (Single Source of Truth)
* **El Problema Superado:** En versiones anteriores se copiaba un archivo `portal/index.html` estático en cada repositorio. Esto obligaba a hacer commits y deploys en decenas de repositorios ante cualquier cambio estético o funcional.
* **Solución Centralizada:**
  * El código fuente del portal vive **únicamente** en `SentinelIDPY` en la ruta `/portal/[slug]`.
  * Los repositorios de los clientes no tienen carpetas de portal ni archivos HTML duplicados.
  * Cuando se añade una mejora a SentinelIDPY (nuevos gráficos, reportes descargables, filtros de fecha), **el 100% de la flota de clientes la recibe al instante de forma automática**.

#### Especificaciones Técnicas y de Seguridad:
1. **Enrutamiento y Assets:**
   En cada web de cliente, `vercel.json` proyecta tanto la página como los chunks de estilos/scripts de Next.js:
   ```json
   "rewrites": [
     { "source": "/portal", "destination": "https://idpy-admin.vercel.app/portal/[slug]" },
     { "source": "/portal/(.*)", "destination": "https://idpy-admin.vercel.app/portal/[slug]/$1" },
     { "source": "/_next/(.*)", "destination": "https://idpy-admin.vercel.app/_next/$1" },
     { "source": "/api/portal/(.*)", "destination": "https://idpy-admin.vercel.app/api/portal/$1" }
   ]
   ```
2. **Seguridad del Magic Link:**
   * Sin contraseñas: El cliente solo digita su correo registrado.
   * La API `/api/portal/magic-link` valida contra la base de datos y envía el enlace exclusivo por correo mediante Resend.
   * **Seguridad Estricta:** La respuesta JSON de la API **omite `magicLink` y `token`**, impidiendo cualquier bypass desde la pantalla o herramientas de desarrollador.
   * El token está firmado criptográficamente con HMAC SHA-256 y caduca estrictamente a los 7 días.
3. **Experiencia de Entrada Suave (Smooth Loader):**
   * Al pulsar el enlace del correo (`?token=...`), el formulario de login no se muestra en ningún momento.
   * Se despliega inmediatamente un loader circular con el mensaje *"Accediendo... Validando tu enlace de acceso seguro"*.
   * Un umbral visual de 450 ms asegura una transición suave hacia el panel de métricas reales.
4. **Métricas en Pantalla:**
   * Visitas Totales y Visitantes Únicos (30 días).
   * Clics en WhatsApp destacados en verde (conversión web real a reservas).
   * Tasa de conversión calculada automáticamente (% de visitantes que iniciaron conversación).
   * Desglose diario de los últimos 7 días con badges visuales.
   * Ciudades de origen de los visitantes y proporción de dispositivos (Celulares vs. Computadoras).

#### Checklist Rápido para Nuevas Implementaciones (2 minutos):
- [ ] 1. En `SentinelIDPY`: Registrar el cliente en el CRM con su `slug` (ej: `hotel-los-lagos`) y el correo del dueño para autorizar su acceso.
- [ ] 2. En la web del cliente (`index.html`): Agregar `<script src="https://idpy-admin.vercel.app/telemetry.js" data-site="hotel-los-lagos" defer></script>`.
- [ ] 3. En la web del cliente (`vercel.json`): Agregar las 4 reglas de `rewrites` apuntando a `https://idpy-admin.vercel.app/portal/hotel-los-lagos`.
- [ ] 4. Desplegar (`git push` o `vercel --prod`) y verificar en `https://[dominio]/portal`.
