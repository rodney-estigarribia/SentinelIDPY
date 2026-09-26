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

describe('Portal de Clientes & Telemetría - Test Suite de Regresión (v1)', () => {

  describe('1. Endpoint Magic Link (/api/portal/magic-link)', () => {
    it('[TC-01] Camino Feliz: Solicita enlace con correo autorizado (Cabaña del Árbol)', async () => {
      const res = await fetch(`${BASE_URL}/api/portal/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteSlug: 'cabana-del-arbol',
          email: 'rodney.estigarribia@outlook.com',
        }),
      });

      assert.equal(res.status, 200, `Debería responder HTTP 200 pero dio ${res.status}`);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.match(data.message, /enlace de acceso/i);
      assert.ok(data.emailDelivery, 'Debe incluir estado de entrega de correo');
    });

    it('[TC-02] Camino Feliz: Solicita enlace para clientes satélite autorizados', async () => {
      // Terrazas Bungalow
      const resTerrazas = await fetch(`${BASE_URL}/api/portal/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteSlug: 'terrazas-bungalow',
          email: 'reservas@terrazasbungalow.com.py',
        }),
      });
      assert.equal(resTerrazas.status, 200);

      // Don Mendoza
      const resMendoza = await fetch(`${BASE_URL}/api/portal/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteSlug: 'don-mendoza',
          email: 'contacto@donmendoza.com.py',
        }),
      });
      assert.equal(resMendoza.status, 200);
    });

    it('[TC-03] Seguridad: Rechazo estricto de correo no autorizado (403 Forbidden)', async () => {
      const res = await fetch(`${BASE_URL}/api/portal/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteSlug: 'cabana-del-arbol',
          email: 'hacker-random@attacker.net',
        }),
      });

      assert.equal(res.status, 403, `Debería rechazar con 403 pero dio ${res.status}`);
      const data = await res.json();
      assert.match(data.error, /no coincide con el correo autorizado/i);
    });

    it('[TC-04] Validación: Payload incompleto sin siteSlug o sin email (400 Bad Request)', async () => {
      const res = await fetch(`${BASE_URL}/api/portal/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'rodney.estigarribia@outlook.com',
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.ok(data.error);
    });
  });

  describe('2. Endpoint de Estadísticas & Validación Criptográfica (/api/portal/stats)', () => {
    it('[TC-05] Camino Feliz: Consulta de analítica con Token HMAC válido y vigente', async () => {
      const token = generateTestToken('cabana-del-arbol', 'rodney.estigarribia@outlook.com');
      const res = await fetch(`${BASE_URL}/api/portal/stats?siteSlug=cabana-del-arbol&token=${token}`);

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

      const res = await fetch(`${BASE_URL}/api/portal/stats?siteSlug=cabana-del-arbol&token=${tamperedToken}`);
      assert.equal(res.status, 403, `Debe rechazar token manipulado con 403 pero dio ${res.status}`);
      const data = await res.json();
      assert.match(data.error, /adulterada|inválida/i);
    });

    it('[TC-07] Seguridad: Rechazo de Token Expirado (401 Unauthorized)', async () => {
      // Expirado hace 1 hora (-3600000 ms)
      const expiredToken = generateTestToken('cabana-del-arbol', 'rodney.estigarribia@outlook.com', -3600000);

      const res = await fetch(`${BASE_URL}/api/portal/stats?siteSlug=cabana-del-arbol&token=${expiredToken}`);
      assert.equal(res.status, 401, `Debe rechazar token vencido con 401 pero dio ${res.status}`);
      const data = await res.json();
      assert.match(data.error, /ha expirado/i);
    });

    it('[TC-08] Seguridad: Rechazo de Token de otro Sitio (Cross-Site Token Swap, 403)', async () => {
      // Token generado legítimamente para cabana-del-arbol
      const tokenCabana = generateTestToken('cabana-del-arbol');

      // Intento de uso para acceder a terrazas-bungalow
      const res = await fetch(`${BASE_URL}/api/portal/stats?siteSlug=terrazas-bungalow&token=${tokenCabana}`);
      assert.equal(res.status, 403, `Debe impedir el cross-site swap con 403 pero dio ${res.status}`);
      const data = await res.json();
      assert.match(data.error, /no corresponde a este sitio/i);
    });

    it('[TC-09] Seguridad: Rechazo de consulta sin token o sin siteSlug (401 Unauthorized)', async () => {
      const res = await fetch(`${BASE_URL}/api/portal/stats?siteSlug=cabana-del-arbol`);
      assert.equal(res.status, 401);
    });
  });

  describe('3. Ingesta de Telemetría (/api/tracker)', () => {
    it('[TC-10] Camino Feliz: Ingesta correcta de Pageview', async () => {
      const res = await fetch(`${BASE_URL}/api/tracker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteSlug: 'cabana-del-arbol',
          eventType: 'pageview',
          path: '/test-automated-suite',
          referrer: 'https://google.com',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
    });

    it('[TC-11] Camino Feliz: Ingesta de WhatsApp Click', async () => {
      const res = await fetch(`${BASE_URL}/api/tracker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteSlug: 'cabana-del-arbol',
          eventType: 'whatsapp_click',
          path: '/test-automated-suite',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
    });

    it('[TC-12] Validación: Rechazo de evento sin siteSlug o eventType (400 Bad Request)', async () => {
      const res = await fetch(`${BASE_URL}/api/tracker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '/test-invalid',
        }),
      });

      assert.equal(res.status, 400);
    });
  });

  describe('4. API de Configuración Remota de Satélites (/api/sites/[id]/config)', () => {
    it('[TC-13] Camino Feliz: Consulta de configuración remota por slug', async () => {
      const res = await fetch(`${BASE_URL}/api/sites/cabana-del-arbol/config`);
      assert.equal(res.status, 200);
      const config = await res.json();

      assert.equal(config.slug, 'cabana-del-arbol');
      assert.ok(config.whatsapp, 'Debe contener configuración de WhatsApp');
      assert.ok(config.demo, 'Debe contener configuración de Demo');
    });

    it('[TC-14] Camino Feliz: Consulta de configuración remota por ID numérico', async () => {
      const res = await fetch(`${BASE_URL}/api/sites/11/config`);
      assert.equal(res.status, 200);
      const config = await res.json();
      assert.ok(config.whatsapp);
    });
  });

});
