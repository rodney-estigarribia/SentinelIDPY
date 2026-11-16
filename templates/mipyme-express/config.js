/**
 * CABAÑA DEL ÁRBOL — Configuración Central
 * ==========================================
 * Editá solo este archivo para actualizar toda la web.
 * Para cambiar WhatsApp, precios o nombre: modificá aquí.
 */

const SITE_CONFIG = {
  // ─── Banner de demo (vista previa de 7 días) ──────────────────────────────
  demo: {
    // Cuando el cliente pague: poner en false y el banner desaparece para siempre
    // (también se habilita la indexación en Google).
    active: true,
    // Día en que se le envía la demo al cliente (AAAA-MM-DD). Si se envía otro
    // día, cambiar solo esta fecha. El contador vence a las 23:59 (hora de
    // Paraguay) del último día.
    startDate: "2026-09-23",
    days: 8,
  },

  // ─── Control de Propuesta Comercial (/propuesta) ──────────────────────────
  proposal: {
    // true: accesible en /propuesta | false: redirige a / (desactivada/archivada)
    active: true,
  },

  business: {
    name: "Cabaña del Árbol",
    tagline: "Tu refugio a orillas del Lago Ypacaraí",
    description:
      "Una experiencia de desconexión total. Naturaleza, privacidad y vistas panorámicas al lago.",
    location: "San Bernardino, Cordillera — Paraguay",
    locationLink:
      "https://www.google.com/maps/search/?api=1&query=San+Bernardino%2C+Cordillera%2C+Paraguay",
    instagram: "https://www.instagram.com/cabana_delarbol/",
    checkin: "12:00 hs",
    checkout: "12:00 hs",
    currency: "Gs.",
  },

  whatsapp: {
    // Número completo con código de país (sin + ni espacios)
    phone: "595982957509",
    defaultMessage:
      "¡Hola! Estuve viendo la web de Cabaña del Árbol y quisiera consultar disponibilidad. ¿Me podrían ayudar? 🌿",
    reservationMessage:
      "¡Hola! Vi la web de Cabaña del Árbol y quiero hacer una reserva.\n\n📅 Fechas: \n👥 Opción: \n\n¿Me pueden confirmar disponibilidad y los datos para la seña?",
    cabanaMessage:
      "¡Hola! Me interesa reservar *La Cabaña* (solo parejas) a Gs. 1.300.000 / 1.500.000 por noche.\n\n📅 Fechas: \n\n¿Tienen disponibilidad?",
    casonaMessage:
      "¡Hola! Me interesa reservar *La Casona* (grupal) a Gs. 2.500.000 por noche.\n\n📅 Fechas: \n👥 Cantidad de personas: \n\n¿Tienen disponibilidad?",
  },

  pricing: {
    cabana: {
      name: "La Cabaña",
      subtitle: "Solo Parejas",
      weekday: "1.300.000",
      weekend: "1.500.000",
      note: "Incluye desayuno",
      emoji: "🏡",
    },
    casona: {
      name: "La Casona",
      subtitle: "Grupos",
      night: "2.500.000",
      note: "Incluye desayuno",
      emoji: "🏘️",
    },
  },

  conditions: [
    "Seña del 50% para confirmar la reserva",
    "Reagendamiento con 10 días de anticipación",
    "Saldo restante se abona al check-in",
    "Formas de pago: Efectivo o Transferencia",
  ],

  features: [
    {
      icon: "lake",
      title: "Vista Panorámica al Lago",
      body: "Vistas incomparables al Lago Ypacaraí al amanecer y atardecer desde cada rincón.",
    },
    {
      icon: "jacuzzi",
      title: "Jacuzzi Privado en Deck",
      body: "Relajate en el deck de madera con jacuzzi y hamacas sobre la orilla del lago.",
    },
    {
      icon: "breakfast",
      title: "Desayuno Incluido",
      body: "Comenzá el día con energía. El desayuno está incluido en todas las estadías.",
    },
    {
      icon: "ac",
      title: "Climatización Completa",
      body: "Confort garantizado en todo momento con aire acondicionado en cada ambiente.",
    },
    {
      icon: "wifi",
      title: "WiFi de Alta Velocidad",
      body: "Conectividad para los que necesitan trabajar, o para compartir los mejores momentos.",
    },
    {
      icon: "private",
      title: "Total Privacidad",
      body: "El espacio es exclusivo para vos. Sin vecinos, sin interrupciones.",
    },
  ],
};

// ─── Demo: vencimiento ─────────────────────────────────────────────────────────
// Paraguay usa UTC-3 todo el año
const DEMO_EXPIRES_AT =
  new Date(SITE_CONFIG.demo.startDate + "T23:59:59-03:00").getTime() +
  SITE_CONFIG.demo.days * 24 * 60 * 60 * 1000;

function isDemoExpired() {
  return SITE_CONFIG.demo.active && Date.now() >= DEMO_EXPIRES_AT;
}

// Se ejecuta en el <head>: si ya venció, la página nunca llega a mostrarse
if (isDemoExpired()) document.documentElement.classList.add("demo-expired");

// ─── WhatsApp Helper ───────────────────────────────────────────────────────────
function buildWhatsAppURL(message) {
  const base = "https://wa.me/" + SITE_CONFIG.whatsapp.phone;
  const encoded = encodeURIComponent(message);
  return base + "?text=" + encoded;
}

function bindWhatsAppButtons() {
  document.querySelectorAll("[data-whatsapp]").forEach(function (el) {
    const type = el.getAttribute("data-whatsapp");
    let message = SITE_CONFIG.whatsapp.defaultMessage;

    if (type === "cabana") message = SITE_CONFIG.whatsapp.cabanaMessage;
    else if (type === "casona") message = SITE_CONFIG.whatsapp.casonaMessage;
    else if (type === "reserve")
      message = SITE_CONFIG.whatsapp.reservationMessage;

    el.href = buildWhatsAppURL(message);
    el.target = "_blank";
    el.rel = "noopener noreferrer";
  });
}

// Bind all [data-whatsapp] buttons on DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
  bindWhatsAppButtons();

  // Sincronización remota en segundo plano con SentinelIDPY (Etapa 2)
  if (window.fetch) {
    fetch("https://idpy-admin.vercel.app/api/sites/cabana-del-arbol/config")
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (remote) {
        if (!remote) return;

        // WhatsApp
        if (remote.whatsapp) {
          if (remote.whatsapp.phone) SITE_CONFIG.whatsapp.phone = remote.whatsapp.phone;
          if (remote.whatsapp.defaultMessage) SITE_CONFIG.whatsapp.defaultMessage = remote.whatsapp.defaultMessage;
          if (remote.whatsapp.reservationMessage) SITE_CONFIG.whatsapp.reservationMessage = remote.whatsapp.reservationMessage;
          bindWhatsAppButtons();
        }

        // Propuesta comercial
        if (remote.proposal !== undefined) {
          SITE_CONFIG.proposal = remote.proposal;
          if (SITE_CONFIG.proposal.active === false && (window.location.pathname.startsWith('/propuesta') || window.location.pathname.includes('propuesta'))) {
            window.location.replace('/');
          }
        }

        // Demo banner
        if (remote.demo !== undefined) {
          SITE_CONFIG.demo = remote.demo;
          if (!SITE_CONFIG.demo.active) {
            const bar = document.querySelector('.demo-bar');
            if (bar) bar.remove();
            document.body.classList.remove('has-demo-bar');
            document.documentElement.classList.remove('demo-expired');
          }
        }
      })
      .catch(function () {});
  }
});
