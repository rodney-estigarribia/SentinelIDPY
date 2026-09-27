/**
 * SentinelIDPY - Validación de Seguridad & Sanitización de Entradas
 * Previene inyecciones SMTP, evasión de expresiones regulares y ataques de denegación de servicio.
 */

// Cabeceras HTTP de seguridad recomendadas por OWASP
export const standardSecurityHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
};

/**
 * Valida y sanitiza una dirección de correo electrónico según RFC 5322,
 * bloqueando inyecciones de cabeceras SMTP y longitudes anómalas.
 */
export function validateEmailSecurity(
  email: unknown
): { valid: boolean; error?: string; cleanEmail?: string } {
  if (typeof email !== 'string') {
    return { valid: false, error: 'El correo electrónico debe ser una cadena de texto válida.' };
  }

  const trimmed = email.trim();

  // 1. Límites de longitud razonables (mínimo a@b.c = 5, máximo estándar 120)
  if (trimmed.length < 5 || trimmed.length > 120) {
    return { valid: false, error: 'El correo electrónico debe tener entre 5 y 120 caracteres.' };
  }

  // 2. Blindaje contra inyección de cabeceras SMTP (CR, LF, NULL bytes o codificados)
  if (/[\r\n\0]/.test(trimmed) || /%0[da]/i.test(trimmed)) {
    return { valid: false, error: 'Caracteres no permitidos detectados en el correo.' };
  }

  // 3. Estándar RFC 5322 para formato de email
  const RFC5322_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!RFC5322_REGEX.test(trimmed)) {
    return { valid: false, error: 'Formato de correo electrónico no válido.' };
  }

  return { valid: true, cleanEmail: trimmed.toLowerCase() };
}

/**
 * Valida y normaliza un slug de sitio.
 */
export function validateSiteSlugSecurity(
  slug: unknown
): { valid: boolean; error?: string; cleanSlug?: string } {
  if (typeof slug !== 'string') {
    return { valid: false, error: 'Slug de sitio no válido.' };
  }

  const trimmed = slug.trim().toLowerCase();

  if (trimmed.length < 2 || trimmed.length > 64) {
    return { valid: false, error: 'Longitud de slug inválida (debe tener entre 2 y 64 caracteres).' };
  }

  if (!/^[a-z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: 'El slug contiene caracteres no permitidos.' };
  }

  return { valid: true, cleanSlug: trimmed };
}
