/**
 * SentinelIDPY - In-Memory Sliding Window Rate Limiter & Cooldown Manager
 * Protege endpoints serverless contra ataques de fuerza bruta, spamming y DDoS.
 */

class SecurityLimiter {
  private ipWindows: Map<string, number[]>;
  private emailCooldowns: Map<string, number>;
  private trackerWindows: Map<string, number[]>;

  constructor() {
    this.ipWindows = new Map();
    this.emailCooldowns = new Map();
    this.trackerWindows = new Map();

    // Limpieza periódica de memoria cada 10 minutos
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 10 * 60 * 1000).unref?.();
    }
  }

  /**
   * Rate limiting por IP (Sliding Window): Máx N peticiones por ventana de tiempo.
   */
  checkIpLimit(
    ip: string,
    maxRequests = 5,
    windowMs = 10 * 60 * 1000
  ): { allowed: boolean; remaining: number; retryAfterSec?: number } {
    const now = Date.now();
    const timestamps = (this.ipWindows.get(ip) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      const oldest = timestamps[0];
      const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
      return { allowed: false, remaining: 0, retryAfterSec };
    }

    timestamps.push(now);
    this.ipWindows.set(ip, timestamps);
    return { allowed: true, remaining: maxRequests - timestamps.length };
  }

  /**
   * Cooldown por email: Mínimo N segundos entre solicitudes a la misma casilla.
   */
  checkEmailCooldown(
    email: string,
    cooldownMs = 60 * 1000
  ): { allowed: boolean; remainingSec?: number } {
    const now = Date.now();
    const cleanEmail = email.trim().toLowerCase();
    const lastAttempt = this.emailCooldowns.get(cleanEmail);

    if (lastAttempt && now - lastAttempt < cooldownMs) {
      const remainingSec = Math.max(1, Math.ceil((lastAttempt + cooldownMs - now) / 1000));
      return { allowed: false, remainingSec };
    }

    this.emailCooldowns.set(cleanEmail, now);
    return { allowed: true };
  }

  /**
   * Rate limiting para el tracker de telemetría: Máx N eventos por minuto por IP.
   */
  checkTrackerLimit(
    ip: string,
    maxRequests = 120,
    windowMs = 60 * 1000
  ): boolean {
    const now = Date.now();
    const timestamps = (this.trackerWindows.get(ip) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      return false;
    }

    timestamps.push(now);
    this.trackerWindows.set(ip, timestamps);
    return true;
  }

  /**
   * Limpieza de registros vencidos para evitar fugas de memoria.
   */
  cleanup() {
    const now = Date.now();
    // Limpiar IPs inactivas por más de 15 minutos
    for (const [ip, list] of this.ipWindows.entries()) {
      const valid = list.filter((t) => now - t < 15 * 60 * 1000);
      if (valid.length === 0) this.ipWindows.delete(ip);
      else this.ipWindows.set(ip, valid);
    }
    // Limpiar cooldowns mayores a 5 minutos
    for (const [email, last] of this.emailCooldowns.entries()) {
      if (now - last > 5 * 60 * 1000) this.emailCooldowns.delete(email);
    }
    // Limpiar tracker
    for (const [ip, list] of this.trackerWindows.entries()) {
      const valid = list.filter((t) => now - t < 2 * 60 * 1000);
      if (valid.length === 0) this.trackerWindows.delete(ip);
      else this.trackerWindows.set(ip, valid);
    }
  }

  /**
   * Reseteo manual para pruebas automatizadas.
   */
  reset() {
    this.ipWindows.clear();
    this.emailCooldowns.clear();
    this.trackerWindows.clear();
  }
}

// Singleton global persistente entre invocaciones serverless calientes
const globalKey = Symbol.for('sentinel.securityLimiter');
const globalObj = globalThis as unknown as { [key: symbol]: SecurityLimiter };

if (!globalObj[globalKey]) {
  globalObj[globalKey] = new SecurityLimiter();
}

export const securityLimiter = globalObj[globalKey];
