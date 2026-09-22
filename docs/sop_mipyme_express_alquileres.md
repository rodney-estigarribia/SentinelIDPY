# SOP Maestro: Mi Primera Web MiPyME Express 🏡
### Nicho Piloto: Alquileres Temporales, Quintas, Cabañas & Bungalows
**Impulsos Digitales / SentinelIDPY**  
*Documento de Procedimiento Operativo Estándar (SOP)*  
*Objetivo:* Prospección en frío, ensamblado ultrarrápido con IA y cierre comercial con el modelo de escasez (7 días).

---

## 🎯 Resumen de la Oferta y Números

* **Ticket Frontal:** **₲ 610.000 / año** (Cubre dominio `.com` o `.com.py`, hosting rápido en Vercel/CDN, certificados SSL y resguardo técnico anual).
* **Gancho / Ancla:** Mano de obra de diseño y desarrollo **100% bonificada** por lanzamiento (Valor real de lista: ₲ 1.200.000).
* **Tiempo Máximo de Producción:** **< 30 a 45 minutos** por prospecto (usando la arquitectura de componentes probada en `terrazas-bungalow`).
* **Regla de Cierre:** Enlace de prueba con cuenta regresiva de **7 días**. Si no se confirma el pago del hosting/dominio, la demo se da de baja automáticamente.

---

## 🗺️ Flujo Operativo en 5 Fases

```
[Fase 1: Cacería en Frío] ──► Detectar 3-5 quintas en Sanber/Altos/Cordillera sin web
           │
[Fase 2: Extracción IA]  ──► Copiar fotos de IG/FB, precios de WhatsApp, ubicación
           │
[Fase 3: Ensamblado 24h] ──► Inyectar datos en plantilla Next.js/Static + Deploy Vercel
           │
[Fase 4: El Envío 7 Días]──► Mensaje de preview con escasez y propuesta bonificada
           │
[Fase 5: Cobro & Upsell] ──► Transferencia ₲ 610.000 + Pregunta de dolor para recurrencia
```

---

## 🔍 Fase 1: Cacería de Candidatos (15 a 20 min)

### Dónde buscar:
1. **Instagram:** Búsquedas por hashtags y ubicaciones:
   * `#alquilerquinta`, `#quintaspy`, `#sanbernardinopy`, `#posadaparaguay`, `#cabañasparaguay`, `#cordillerapy`.
   * Ubicaciones geográficas: *San Bernardino*, *Altos*, *Atyrá*, *Piribebuy*, *Paraguarí*, *Ybycuí*.
2. **Facebook Marketplace & Grupos:**
   * "Alquiler de quintas en San Bernardino y alrededores".
   * "Quintas y casas de campo Paraguay".
3. **Google Maps:**
   * Buscar *"quintas en alquiler cerca de San Bernardino"*. Detectar aquellas que tienen perfil con fotos pero botón "Sitio web" vacío.

### Criterio de Selección (El perfil ideal):
* [x] Tienen fotos decentes en redes sociales (piscina, quincho, habitaciones).
* [x] Están activos (publicaron en los últimos 30 días).
* [x] Tienen enlace directo a WhatsApp en su biografía, **pero NO tienen web**.
* [x] Su tarifa por día/fin de semana es igual o superior a ₲ 600.000 (lo que significa que 1 sola reserva cubre tu tarifa anual).

---

## 📸 Fase 2: Extracción Rápida de Datos (10 min)

Para no pedirle nada al dueño antes de tiempo, extraes la información pública de sus redes:
1. **Nombre comercial y Logotipo** (o foto de perfil limpia).
2. **4 a 6 Fotos destacadas:** Fachada, piscina, quincho/parrilla, dormitorios, vista/atardecer.
3. **Comodidades básicas:** Aire acondicionado, wifi, estacionamiento, pet friendly, capacidad de personas.
4. **Número de WhatsApp comercial:** El número del enlace de su biografía.
5. **Enlace de Google Maps:** Si ya lo tienen en su perfil.

---

## ⚡ Fase 3: Ensamblado y Despliegue Express (25 min)

Utiliza la arquitectura desacoplada probada en `pool-cleaner-web` y `terrazas_bungalow`.

### 1. El Archivo Central de Configuración (`config.js` / `site-config.ts`):
Toda la landing se personaliza cambiando un solo archivo:
```javascript
export const SITE_CONFIG = {
  business: {
    name: "Quinta Los Lapachos",
    location: "San Bernardino, Cordillera",
    tagline: "Tu refugio privado de descanso y naturaleza a 45 min de Asunción",
    currency: "Gs."
  },
  whatsapp: {
    phone: "595981123456",
    defaultMessage: "¡Hola! Vi la web de Quinta Los Lapachos y quisiera consultar disponibilidad..."
  },
  pricing: {
    individualDay: "800.000",
    weekendPack: "1.500.000",
    pasaDia: "1.000.000"
  },
  features: [
    "Piscina con solárium",
    "Quincho techado con parrilla",
    "Habitaciones 100% climatizadas",
    "Estacionamiento privado interno"
  ]
};
```

### 2. El Concierge de WhatsApp (Valor diferencial):
Asegurar que el botón de reserva principal abra WhatsApp con el mensaje ya estructurado:
```
https://wa.me/595981XXXXXX?text=¡Hola!%20Estuve%20viendo%20la%20web%20y%20quiero%20consultar%20disponibilidad%20para%20un%20fin%20de%20semana.%20¿Me%20podrían%20pasar%20fechas%20libres?
```

### 3. Despliegue en Vercel:
* Nombre del subdominio temporal: `https://[nombre-quinta]-demo.vercel.app`
* Verificar que en celular cargue en menos de 2 segundos.

---

## 📲 Fase 4: La Secuencia de Mensajes y Cierre (7 Días)

### Mensaje 1: El Permiso para enviar el preview (Vía WhatsApp o DM de Instagram)
> *"¡Hola [Nombre o Equipo de Quinta XYZ]! 👋 ¿Cómo están?  
> Estuve mirando sus fotos y el espacio hermoso que tienen en [San Bernardino/Altos].  
> Noté que no contaban con un sitio web oficial para que los huéspedes vean las fotos en alta calidad, las comodidades y puedan consultar disponibilidad sin dar tantas vueltas en WhatsApp.  
> Por iniciativa propia y para sumarles valor, les preparé un prototipo funcional para que lo miren sin ningún compromiso.  
> ¿Está bien si les paso el link para que le den una mirada?"*

---

### Mensaje 2: La Entrega con Escasez (Al responder afirmativamente)
> *"¡Buenísimo! Aquí les dejo el enlace de prueba:  
> 👉 `https://[nombre-quinta]-demo.vercel.app`  
> *(Les recomiendo abrirlo desde el celular que es donde navega la mayoría de los huéspedes)*.  
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
> *"¡Hola [Nombre]! 👋 Quería consultarles si tuvieron oportunidad de ver la web de [Nombre de la Quinta].  
> Como la demo temporal vence en 3 días, quería saber si les interesaría conservarla o si tienen alguna consulta sobre cómo funciona el botón de reservas directas a su WhatsApp. ¡Quedo a las órdenes!"*

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
> Apenas me envíen el comprobante, conectamos el dominio propio y les entrego el enlace oficial listo para colocar en la biografía de su Instagram y Google Maps."*

---

## 💎 Fase 5: Entrega Final y Disparo del Upsell Recurrente

Una vez que pagaron los ₲ 610.000 y la web está en su dominio:

1. **La Pregunta Guiada (Detección del dolor):**
   > *"¡Ya está tu web 100% activa en tu dominio oficial! 🎉  
   > Para ayudarte a vender más: de estas 3 cosas en tu día a día, ¿cuál es la que más tiempo te hace perder?:  
   > 1. Que te pidan fotos y precios por WhatsApp y después te dejen en visto.  
   > 2. Coordinar fechas de reservas y que se te superpongan o se olviden de confirmar la seña.  
   > 3. Que te cueste conseguir reseñas de 5 estrellas en Google Maps."*

2. **La Propuesta de Plataforma / Módulo Extra (+ ₲ 40.000 a ₲ 60.000 / mes):**
   * Si el dolor es **reservas/fechas**: Activar el calendario interactivo de disponibilidad.
   * Si el dolor es **seguimiento**: Activar mensajes automáticos pre-configurados para solicitud de reseñas y cobro de saldo al llegar.

---

## 📋 Métricas Clave de Control (KPIs)

* **Prospecciones enviadas por semana:** 5 a 10 contactos.
* **Tasa de aceptación de demo:** ~40% a 60% (aceptan ver el link).
* **Tasa de conversión a pago:** ~20% a 30% (de cada 5 demos enviadas, 1 a 2 compran el paquete de ₲ 610.000).
* **Ingreso por lote de 5 demos:** ₲ 610.000 a ₲ 1.220.000 (con solo 2 a 3 horas de trabajo efectivo).
