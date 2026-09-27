import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3005';
const SECRET = process.env.SESSION_SECRET || 'sentinel-idpy-secure-session-secret-key-2026-very-long';

function generateTestToken(
  siteSlug: string,
  email: string = 'rodney.estigarribia@outlook.com',
  expOffsetMs: number = 7 * 24 * 60 * 60 * 1000
): string {
  const exp = Date.now() + expOffsetMs;
  const payload = JSON.stringify({ siteSlug, email, exp });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

function fetchWithIp(url: string, options: RequestInit = {}, clientIp?: string) {
  const headers = new Headers(options.headers || {});
  if (clientIp) {
    headers.set('x-forwarded-for', clientIp);
  }
  return fetch(url, { ...options, headers });
}

describe('Portal de Clientes & Telemetría - Test Suite de Regresión (v1)', () => {

  describe('1. Endpoint Magic Link (/api/portal/magic-link)', () => {
    it('[TC-01] Camino Feliz: Solicita enlace con correo autorizado (Cabaña del Árbol)', async () => {
      const res = await fetchWithIp(
        `${BASE_URL}/api/portal/magic-link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteSlug: 'cabana-del-arbol',
            email: 'rodney.estigarribia@outlook.com',
          }),
        },
        '10.1.1.1'
      );

      assert.equal(res.status, 200, `Debería responder HTTP 200 pero dio ${res.status}`);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.match(data.message, /enlace de acceso/i);
      assert.ok(data.emailDelivery, 'Debe incluir estado de entrega de correo');
    });

    it('[TC-02] Camino Feliz: Solicita enlace para clientes satélite autorizados', async () => {
      // Terrazas Bungalow
      const resTerrazas = await fetchWithIp(
        `${BASE_URL}/api/portal/magic-link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteSlug: 'terrazas-bungalow',
            email: 'reservas@terrazasbungalow.com.py',
          }),
        },
        '10.1.1.2'
      );
      assert.equal(resTerrazas.status, 200);

      // Don Mendoza
      const resMendoza = await fetchWithIp(
        `${BASE_URL}/api/portal/magic-link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteSlug: 'don-mendoza',
            email: 'contacto@donmendoza.com.py',
          }),
        },
        '10.1.1.3'
      );
      assert.equal(resMendoza.status, 200);
    });

    it('[TC-03] Seguridad: Rechazo estricto de correo no autorizado (403 Forbidden)', async () => {
      const res = await fetchWithIp(
        `${BASE_URL}/api/portal/magic-link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteSlug: 'cabana-del-arbol',
            email: 'hacker-random@attacker.net',
          }),
        },
        '10.1.1.4'
      );

      assert.equal(res.status, 403, `Debería rechazar con 403 pero dio ${res.status}`);
      const data = await res.json();
      assert.match(data.error, /no coincide con el correo autorizado/i);
    });

    it('[TC-04] Validación: Payload incompleto sin siteSlug o sin email (400 Bad Request)', async () => {
      const res = await fetchWithIp(
        `${BASE_URL}/api/portal/magic-link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'rodney.estigarribia@outlook.com',
          }),
        },
        '10.1.1.5'
      );

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.ok(data.error);
    });
  });

  describe('2. Endpoint de Estadísticas & Validación Criptográfica (/api/portal/stats)', () => {
    it('[TC-05] Camino Feliz: Consulta de analítica con Token HMAC válido y vigente', async () => {
      const token = generateTestToken('cabana-del-arbol', 'rodney.estigarribia@outlook.com');
      const res = await fetchWithIp(`${BASE_URL}/api/portal/stats?siteSlug=cabana-del-arbol&token=${token}`);

      assert.equal(res.status, 200, `Debería responder HTTP 200 pero dio ${res.status}`);
      const data = await res.json();

      assert.equal(data.siteName, 'Cabaña del Árbol');
      assert.ok(data.summary, 'Debe incluir summary de KPIs');
      assert.equal(typeof data.summary.totalPageviews, 'number');
      assert.equal(typeof data.summary.uniqueVisitors, 'number');
      assert.equal(typeof data.summary.whatsappClicks, 'number');
      assert.equal(typeof data.summary.conversionRate, 'number');
      assert.ok(Array.isArray(data.daily), 'Debe incluir array de días');
      assert.ok(data.devices, 'Debe incluir distribución de dispositivos');
      assert.ok(data.session, 'Debe incluir datos de sesión');
      assert.equal(data.session.expiresInDays, 7);
    });

    it('[TC-06] Seguridad: Rechazo de Token Adulterado o con Firma Manipulada (403 Forbidden)', async () => {
      const validToken = generateTestToken('cabana-del-arbol');
      const [payloadB64] = validToken.split('.');
      const tamperedToken = `${payloadB64}.firmaFalsaManipulada123456789`;

      const res = await fetchWithIp(`${BASE_URL}/api/portal/stats?siteSlug=cabana-del-arbol&token=${tamperedToken}`);
      assert.equal(res.status, 403, `Debe rechazar token manipulado con 403 pero dio ${res.status}`);
      const data = await res.json();
      assert.match(data.error, /adulterada|inválida/i);
    });

    it('[TC-07] Seguridad: Rechazo de Token Expirado (401 Unauthorized)', async () => {
      const expiredToken = generateTestToken('cabana-del-arbol', 'rodney.estigarribia@outlook.com', -3600000);

      const res = await fetchWithIp(`${BASE_URL}/api/portal/stats?siteSlug=cabana-del-arbol&token=${expiredToken}`);
      assert.equal(res.status, 401, `Debe rechazar token vencido con 401 pero dio ${res.status}`);
      const data = await res.json();
      assert.match(data.error, /ha expirado/i);
    });

    it('[TC-08] Seguridad: Rechazo de Token de otro Sitio (Cross-Site Token Swap, 403)', async () => {
      const tokenCabana = generateTestToken('cabana-del-arbol');

      const res = await fetchWithIp(`${BASE_URL}/api/portal/stats?siteSlug=terrazas-bungalow&token=${tokenCabana}`);
      assert.equal(res.status, 403, `Debe impedir el cross-site swap con 403 pero dio ${res.status}`);
      const data = await res.json();
      assert.match(data.error, /no corresponde a este sitio/i);
    });

    it('[TC-09] Seguridad: Rechazo de consulta sin token o sin siteSlug (401 Unauthorized)', async () => {
      const res = await fetchWithIp(`${BASE_URL}/api/portal/stats?siteSlug=cabana-del-arbol`);
      assert.equal(res.status, 401);
    });
  });

  describe('3. Ingesta de Telemetría (/api/tracker)', () => {
    it('[TC-10] Camino Feliz: Ingesta correcta de Pageview', async () => {
      const res = await fetchWithIp(
        `${BASE_URL}/api/tracker`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteSlug: 'cabana-del-arbol',
            eventType: 'pageview',
            path: '/test-automated-suite',
            referrer: 'https://google.com',
          }),
        },
        '10.2.1.1'
      );

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
    });

    it('[TC-11] Camino Feliz: Ingesta de WhatsApp Click', async () => {
      const res = await fetchWithIp(
        `${BASE_URL}/api/tracker`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteSlug: 'cabana-del-arbol',
            eventType: 'whatsapp_click',
            path: '/test-automated-suite',
          }),
        },
        '10.2.1.2'
      );

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
    });

    it('[TC-12] Validación: Rechazo de evento sin siteSlug o eventType (400 Bad Request)', async () => {
      const res = await fetchWithIp(
        `${BASE_URL}/api/tracker`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: '/test-invalid',
          }),
        },
        '10.2.1.3'
      );

      assert.equal(res.status, 400);
    });
  });

  describe('4. API de Configuración Remota de Satélites (/api/sites/[id]/config)', () => {
    it('[TC-13] Camino Feliz: Consulta de configuración remota por slug', async () => {
      const res = await fetchWithIp(`${BASE_URL}/api/sites/cabana-del-arbol/config`);
      assert.equal(res.status, 200);
      const config = await res.json();

      assert.equal(config.slug, 'cabana-del-arbol');
      assert.ok(config.whatsapp, 'Debe contener configuración de WhatsApp');
      assert.ok(config.demo, 'Debe contener configuración de Demo');
    });

    it('[TC-14] Camino Feliz: Consulta de configuración remota por ID numérico', async () => {
      const res = await fetchWithIp(`${BASE_URL}/api/sites/11/config`);
      assert.equal(res.status, 200);
      const config = await res.json();
      assert.ok(config.whatsapp);
    });
  });

  describe('5. Auditoría y Blindaje de Ciberseguridad (Fase 3)', () => {
    it('[TC-15] Seguridad: Trampa Honeypot detecta y neutraliza bots silenciosamente', async () => {
      const res = await fetchWithIp(
        `${BASE_URL}/api/portal/magic-link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteSlug: 'cabana-del-arbol',
            email: 'bot-victim@spam.com',
            hp: 'https://viagra-spam-casino.ru', // Bot rellenó el campo oculto
          }),
        },
        '10.3.1.15'
      );

      assert.equal(res.status, 200, 'Debe devolver HTTP 200 simulado para engañar al bot');
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.emailDelivery.sent, false);
      assert.equal(data.emailDelivery.status, 'honeypot_trapped', 'El bot debe quedar atrapado');
    });

    it('[TC-16] Seguridad: Cooldown por Email bloquea ráfagas a una misma casilla (429 Too Many Requests)', async () => {
      const uniqueEmail = `test-cooldown-${Date.now()}@impulsosdigitales.com.py`;

      // Primer intento: Exitoso
      const res1 = await fetchWithIp(
        `${BASE_URL}/api/portal/magic-link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteSlug: 'cabana-del-arbol',
            email: uniqueEmail,
          }),
        },
        '10.3.1.16'
      );
      assert.equal(res1.status, 200);

      // Segundo intento inmediato (dentro de los 60s): Debe ser bloqueado con 429
      const res2 = await fetchWithIp(
        `${BASE_URL}/api/portal/magic-link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteSlug: 'cabana-del-arbol',
            email: uniqueEmail,
          }),
        },
        '10.3.1.16'
      );

      assert.equal(res2.status, 429, `Debe bloquear reintentos inmediatos con 429 pero dio ${res2.status}`);
      const data2 = await res2.json();
      assert.match(data2.error, /recientemente|esperá/i);
    });

    it('[TC-17] Seguridad: Bloqueo de Inyección de Cabeceras SMTP y formato inválido (400 Bad Request)', async () => {
      // Intento de inyección CRLF para spoofing / BCC spamming
      const resSmtp = await fetchWithIp(
        `${BASE_URL}/api/portal/magic-link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteSlug: 'cabana-del-arbol',
            email: 'admin@cabana.com\r\nBcc: victim@target.com',
          }),
        },
        '10.3.1.17'
      );

      assert.equal(resSmtp.status, 400);
      const dataSmtp = await resSmtp.json();
      assert.match(dataSmtp.error, /caracteres no permitidos|no válido/i);

      // Correo con formato RFC 5322 inválido
      const resInvalid = await fetchWithIp(
        `${BASE_URL}/api/portal/magic-link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteSlug: 'cabana-del-arbol',
            email: 'not-an-email-at-all',
          }),
        },
        '10.3.1.17'
      );

      assert.equal(resInvalid.status, 400);
    });

    it('[TC-18] Seguridad: Cabeceras HTTP de protección OWASP presentes en todas las respuestas', async () => {
      const res = await fetchWithIp(`${BASE_URL}/api/portal/stats?siteSlug=cabana-del-arbol`);

      assert.equal(
        res.headers.get('x-content-type-options'),
        'nosniff',
        'Debe incluir X-Content-Type-Options: nosniff'
      );
      assert.equal(
        res.headers.get('x-frame-options'),
        'SAMEORIGIN',
        'Debe incluir X-Frame-Options: SAMEORIGIN'
      );
      assert.equal(
        res.headers.get('referrer-policy'),
        'strict-origin-when-cross-origin',
        'Debe incluir Referrer-Policy'
      );
    });

    it('[TC-19] Seguridad: Rate Limiting por IP bloquea ataques de fuerza bruta (429 Too Many Requests)', async () => {
      const spamIp = `192.168.99.${Math.floor(Math.random() * 200 + 10)}`;

      // Realizar 5 solicitudes permitidas (límite máximo)
      for (let i = 1; i <= 5; i++) {
        const res = await fetchWithIp(
          `${BASE_URL}/api/portal/magic-link`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              siteSlug: 'cabana-del-arbol',
              email: `user-ip-test-${i}-${Date.now()}@impulsosdigitales.com.py`,
            }),
          },
          spamIp
        );
        assert.equal(res.status, 200, `Intento ${i} debería haber sido aceptado`);
      }

      // La 6ta solicitud desde la misma IP DEBE ser bloqueada con 429 Too Many Requests
      const blockedRes = await fetchWithIp(
        `${BASE_URL}/api/portal/magic-link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteSlug: 'cabana-del-arbol',
            email: `user-ip-test-6-${Date.now()}@impulsosdigitales.com.py`,
          }),
        },
        spamIp
      );

      assert.equal(blockedRes.status, 429, 'La 6ta solicitud debe retornar 429 Too Many Requests');
      assert.ok(blockedRes.headers.get('retry-after'), 'Debe incluir cabecera Retry-After');
      const blockedData = await blockedRes.json();
      assert.match(blockedData.error, /demasiadas solicitudes desde tu dirección ip/i);
    });
  });

});
