import { spawn } from 'node:child_process';
import http from 'node:http';

const PORT = process.env.TEST_PORT || 3005;
const BASE_URL = `http://localhost:${PORT}`;

async function isServerReady(url, maxAttempts = 30, intervalMs = 250) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${url}/api/tracker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      // A 400 Bad Request means the tracker API is up and responding!
      if (res.status === 400 || res.status === 200) {
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

async function main() {
  console.log(`\n🧪 [SentinelIDPY Test Runner] Preparando entorno de pruebas en ${BASE_URL}...`);

  let alreadyRunning = false;
  try {
    const res = await fetch(`${BASE_URL}/api/tracker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.status === 400 || res.status === 200) {
      alreadyRunning = true;
      console.log(`ℹ️ Servidor de pruebas detectado ya en ejecución en ${BASE_URL}.`);
    }
  } catch {
    alreadyRunning = false;
  }

  let serverProc = null;
  if (!alreadyRunning) {
    console.log(`🚀 Iniciando instancia local de Next.js en puerto ${PORT}...`);
    serverProc = spawn('npx', ['next', 'start', '-p', String(PORT)], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: 'ignore',
      detached: false,
    });

    const ready = await isServerReady(BASE_URL);
    if (!ready) {
      console.error(`❌ Error: El servidor de pruebas no inició a tiempo.`);
      if (serverProc) serverProc.kill();
      process.exit(1);
    }
    console.log(`✓ Servidor listo en ${BASE_URL}.\n`);
  }

  console.log(`🏃 Ejecutando suite de pruebas automatizadas...\n`);

  const testProc = spawn('node', ['--test', 'tests/portal-and-telemetry.test.ts'], {
    env: {
      ...process.env,
      TEST_BASE_URL: BASE_URL,
      SESSION_SECRET: process.env.SESSION_SECRET || 'sentinel-idpy-secure-session-secret-key-2026-very-long',
    },
    stdio: 'inherit',
  });

  testProc.on('exit', (code) => {
    if (serverProc) {
      console.log(`\n🧹 Deteniendo servidor de pruebas local...`);
      serverProc.kill();
    }
    console.log(`🏁 Suite completada con código de salida ${code}.\n`);
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
