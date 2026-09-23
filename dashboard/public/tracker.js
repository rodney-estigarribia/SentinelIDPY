/**
 * SentinelIDPY Light Tracker (v1.0)
 * ==============================================================
 * Rastreo ultraligero (< 1.5 KB) sin cookies ni violación de privacidad.
 * Captura: Páginas vistas y Conversiones en WhatsApp.
 * (c) 2026 Impulsos Digitales · https://impulsosdigitales.com.py/
 */
(function () {
  'use strict';
  try {
    var script = document.currentScript || document.querySelector('script[data-site]');
    var siteSlug = script ? script.getAttribute('data-site') : null;
    if (!siteSlug) return;

    var endpoint = script.getAttribute('data-endpoint') || 'https://admin.impulsosdigitales.com.py/api/tracker';

    function sendEvent(type, metadata) {
      var payload = JSON.stringify({
        siteSlug: siteSlug,
        eventType: type,
        path: window.location.pathname || '/',
        referrer: document.referrer || '',
        metadata: metadata || null
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(payload);
      }
    }

    // 1. Registrar Pageview automático
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      sendEvent('pageview');
    } else {
      window.addEventListener('DOMContentLoaded', function () {
        sendEvent('pageview');
      });
    }

    // 2. Escuchar clics en WhatsApp (Conversión)
    document.addEventListener('click', function (e) {
      var target = e.target;
      while (target && target !== document.body) {
        if (target.hasAttribute && target.hasAttribute('data-whatsapp')) {
          var actionType = target.getAttribute('data-whatsapp') || 'general';
          sendEvent('whatsapp_click', { button: actionType, text: (target.innerText || '').slice(0, 50) });
          break;
        }
        if (target.tagName === 'A' && target.href && (target.href.indexOf('wa.me') !== -1 || target.href.indexOf('whatsapp.com') !== -1)) {
          sendEvent('whatsapp_click', { button: 'link', href: target.href.slice(0, 100), text: (target.innerText || '').slice(0, 50) });
          break;
        }
        target = target.parentNode;
      }
    }, true);

  } catch (err) {
    // Fail silently to never disrupt the client's page
  }
})();
