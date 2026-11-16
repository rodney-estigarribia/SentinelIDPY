// ─── demo.js — Banner de demo con cuenta regresiva / pantalla de vencida ───
// Compartido por la web (/) y la propuesta (/propuesta).
// Se controla en config.js → SITE_CONFIG.demo (active, startDate, days).

document.addEventListener("DOMContentLoaded", function () {
  const demo = typeof SITE_CONFIG !== "undefined" && SITE_CONFIG.demo;

  const showExpiredScreen = () => {
    // Se quita todo el contenido: la web deja de ser accesible
    document.body.replaceChildren();
    document.body.className = "";
    document.documentElement.classList.add("demo-expired");
    const screen = document.createElement("main");
    screen.className = "demo-expired-screen";
    screen.innerHTML =
      '<p class="demo-expired-logo">Cabaña <span>del Árbol</span></p>' +
      '<h1 class="demo-expired-title">Esta vista previa ha finalizado</h1>' +
      '<p class="demo-expired-text">La demo de la web estuvo disponible por ' +
      demo.days +
      ' días. Para reactivarla, contactá a ' +
      '<a href="https://impulsosdigitales.com.py/" target="_blank" rel="noopener noreferrer">Impulsos Digitales</a>.</p>';
    document.body.append(screen);
  };

  if (demo && demo.active) {
    // Mientras sea demo, que Google no la indexe
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.content = "noindex, nofollow";

    if (isDemoExpired()) {
      showExpiredScreen();
      return;
    }

    const bar = document.createElement("div");
    bar.className = "demo-bar";
    bar.setAttribute("role", "status");
    bar.innerHTML =
      '<span class="demo-bar-label">Vista previa<span class="demo-bar-long"> de tu nueva web</span> · Disponible por</span>' +
      '<span class="demo-bar-time"></span>';
    document.body.prepend(bar);
    document.body.classList.add("has-demo-bar");

    const timeEl = bar.querySelector(".demo-bar-time");
    const pad = (n) => String(n).padStart(2, "0");
    const tick = () => {
      const left = DEMO_EXPIRES_AT - Date.now();
      if (left <= 0) {
        clearInterval(timer);
        showExpiredScreen();
        return;
      }
      const d = Math.floor(left / 86400000);
      const h = Math.floor((left % 86400000) / 3600000);
      const m = Math.floor((left % 3600000) / 60000);
      const sec = Math.floor((left % 60000) / 1000);
      timeEl.textContent = `${d}d ${pad(h)}h ${pad(m)}m ${pad(sec)}s`;
    };
    const timer = setInterval(tick, 1000);
    tick();
  }
});
