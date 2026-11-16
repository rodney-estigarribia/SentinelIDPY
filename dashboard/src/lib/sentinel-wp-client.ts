/**
 * Cliente HTTP para comunicarse de forma segura con el plugin SentinelIDPY Connector
 * en cada sitio WordPress cliente mediante REST API.
 */

export interface WPStatsResponse {
  status: string;
  wordfence?: {
    total_attacks: number;
    top_ips?: Array<{ ip: string; count: number }>;
    top_urls?: Array<{ url: string; count: number }>;
    top_reasons?: any[];
    top_usernames?: Array<{ user: string; count: number }>;
    last_scan?: string;
    rules_ok: boolean;
    rules_detail?: string;
  };
  infrastructure?: {
    site_size_gb?: number | null;
    disk_free_gb?: number | null;
    php_version?: string;
    wp_version?: string;
    server_ip?: string;
  };
  maintenance?: {
    recent_updates?: any[];
    pending_updates?: {
      plugins: number;
      themes: number;
      wordpress: number;
    };
    last_backup?: string;
    site_health?: {
      status: 'good' | 'recommended' | 'critical';
      good: number;
      recommended: number;
      critical: number;
    };
    total_active_plugins?: number;
  };
  security?: {
    ssl_days_left?: number | string;
  };
  metricas?: any;
}

export interface WPPendingUpdatesResponse {
  status: string;
  wordpress: {
    current: string;
    available?: string;
    update_available: boolean;
    package?: string;
  };
  plugins: Array<{
    name: string;
    slug: string;
    plugin_file: string;
    current_version: string;
    new_version: string;
    package?: string;
  }>;
  themes: Array<{
    name: string;
    slug: string;
    current_version: string;
    new_version: string;
    package?: string;
  }>;
  translations?: Array<{
    type?: string;
    slug: string;
    name: string;
    language?: string;
    version?: string;
  }>;
}

export interface WPPluginItem {
  name: string;
  slug: string;
  file: string;
  version: string;
  is_active: boolean;
  author: string;
  description: string;
  update_available: boolean;
  new_version?: string;
}

export interface WPUserItem {
  id: number;
  login: string;
  email: string;
  display_name: string;
  roles: string[];
  registered: string;
}

async function safeJsonFetch<T = any>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 60000
): Promise<{ ok: boolean; data?: T; error?: string; status: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: 'no-store',
    });

    const text = await res.text();
    let json: any = null;

    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        // Response was not JSON (e.g. fatal error HTML, Cloudflare challenge, etc.)
        return {
          ok: false,
          status: res.status,
          error: `Respuesta HTTP ${res.status} no es JSON: ${text.replace(/<[^>]+>/g, '').trim().slice(0, 180)}`,
        };
      }
    }

    if (!res.ok) {
      let errMsg =
        json?.data?.error?.message ||
        json?.message ||
        json?.error ||
        `Error del servidor HTTP ${res.status}: ${res.statusText}`;
      if (typeof errMsg === 'string') {
        errMsg = errMsg.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }
      return { ok: false, status: res.status, data: json, error: errMsg };
    }

    return { ok: true, status: res.status, data: json };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { ok: false, status: 408, error: `Tiempo de espera agotado (${Math.round(timeoutMs / 1000)}s)` };
    }
    return { ok: false, status: 500, error: err.message || 'Error de red o conexión fallida' };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const HARDCODED_MASTER_TOKEN =
  '905f4c6ec85e34726dd33b787535874217a05ce5e3f430b27afaaf34c839ab6895d197be1dfd13ebd433233998213ea85e6d4dd6fed20a76854a60bc8ba3516f';

export const DEFAULT_WF_REPORT_TOKEN =
  process.env.WF_REPORT_TOKEN && process.env.WF_REPORT_TOKEN.trim().length >= 64
    ? process.env.WF_REPORT_TOKEN.trim()
    : HARDCODED_MASTER_TOKEN;

export function getSiteToken(site?: { token?: string | null }): string {
  const candidate = site?.token?.trim();
  // Valid master token is 128 chars. Dummy or mock tokens are 32 chars.
  if (candidate && candidate.length >= 64 && candidate !== 'a1b2c3d4e5f67890123456789abcdef0') {
    return candidate;
  }
  return DEFAULT_WF_REPORT_TOKEN;
}

export const sentinelWpClient = {
  buildUrl(siteUrl: string, path: string, token: string): string {
    const cleanUrl = siteUrl.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${cleanUrl}/wp-json/sentinel/v1${cleanPath}`);
    url.searchParams.set('_t', Date.now().toString());
    if (token) {
      url.searchParams.set('token', token);
    }
    return url.toString();
  },

  getHeaders(token: string) {
    return {
      'User-Agent': 'SentinelIDPY-MaintenanceBot/1.0',
      'X-WF-Report-Token': token,
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };
  },

  async pingSite(url: string): Promise<{ isUp: boolean; statusCode: number; responseTimeMs: number; error?: string }> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'SentinelIDPY-UptimeMonitor/1.0' },
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);
      const responseTimeMs = Date.now() - start;
      return {
        isUp: res.status >= 200 && res.status < 400,
        statusCode: res.status,
        responseTimeMs,
      };
    } catch (err: any) {
      return {
        isUp: false,
        statusCode: 0,
        responseTimeMs: Date.now() - start,
        error: err.message || 'Connection failed',
      };
    }
  },

  async fetchStats(siteUrl: string, token: string): Promise<{ ok: boolean; data?: WPStatsResponse; error?: string; status: number }> {
    const endpoint = this.buildUrl(siteUrl, '/stats', token);
    return safeJsonFetch<WPStatsResponse>(endpoint, {
      headers: this.getHeaders(token),
    }, 15000);
  },

  async fetchUpdates(siteUrl: string, token: string, forceCheck = false): Promise<{ ok: boolean; data?: WPPendingUpdatesResponse; error?: string; status: number }> {
    let endpoint = this.buildUrl(siteUrl, '/updates', token);
    if (forceCheck) {
      endpoint += '&force_check=1';
    }
    return safeJsonFetch<WPPendingUpdatesResponse>(endpoint, {
      headers: this.getHeaders(token),
    }, 25000);
  },

  async fetchMainWPUpdates(siteUrl: string, token: string): Promise<{ ok: boolean; data?: any; error?: string; status: number }> {
    const endpoint = this.buildUrl(siteUrl, '/mainwp/updates', token);
    return safeJsonFetch<any>(endpoint, {
      headers: this.getHeaders(token),
    }, 25000);
  },

  async applyUpdates(
    siteUrl: string,
    token: string,
    params: { type: 'all' | 'core' | 'plugins' | 'themes' | 'translations'; slugs?: string[]; all?: boolean }
  ): Promise<{ status: string; results?: any; error?: string }> {
    const endpoint = this.buildUrl(siteUrl, '/updates/apply', token);
    const res = await safeJsonFetch(endpoint, {
      method: 'POST',
      headers: {
        ...this.getHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    }, 90000); // 90 seconds for bulk upgrades

    if (!res.ok) {
      return { status: 'error', error: res.error };
    }
    return res.data || { status: 'success' };
  },

  async fetchPlugins(siteUrl: string, token: string): Promise<WPPluginItem[]> {
    const endpoint = this.buildUrl(siteUrl, '/plugins', token);
    const res = await safeJsonFetch<{ status: string; plugins: WPPluginItem[] }>(endpoint, {
      headers: this.getHeaders(token),
    }, 25000);
    return res.ok && res.data?.plugins ? res.data.plugins : [];
  },

  async installPlugin(
    siteUrl: string,
    token: string,
    payload: { slug?: string; zipUrl?: string; zipBase64?: string; activate?: boolean }
  ): Promise<{ status: string; message?: string; error?: string }> {
    const endpoint = this.buildUrl(siteUrl, '/plugins/install', token);
    const res = await safeJsonFetch(endpoint, {
      method: 'POST',
      headers: {
        ...this.getHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug: payload.slug,
        zip_url: payload.zipUrl,
        zip_base64: payload.zipBase64,
        activate: payload.activate,
      }),
    }, 120000);

    if (!res.ok) {
      return { status: 'error', error: res.error };
    }
    return res.data || { status: 'success' };
  },

  async togglePlugin(
    siteUrl: string,
    token: string,
    slug: string,
    action: 'activate' | 'deactivate'
  ): Promise<{ status: string; error?: string; message?: string }> {
    const endpoint = this.buildUrl(siteUrl, '/plugins/toggle', token);
    const res = await safeJsonFetch(endpoint, {
      method: 'POST',
      headers: {
        ...this.getHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug, action }),
    }, 30000);

    if (!res.ok) {
      return { status: 'error', error: res.error };
    }
    return res.data || { status: 'success' };
  },

  async fetchUsers(siteUrl: string, token: string): Promise<WPUserItem[]> {
    const endpoint = this.buildUrl(siteUrl, '/users', token);
    const res = await safeJsonFetch<{ status: string; users: WPUserItem[] }>(endpoint, {
      headers: this.getHeaders(token),
    }, 25000);
    return res.ok && res.data?.users ? res.data.users : [];
  },

  async resetUserPassword(siteUrl: string, token: string, userId: number): Promise<{ status: string; message?: string; error?: string }> {
    const endpoint = this.buildUrl(siteUrl, '/users/reset-password', token);
    const res = await safeJsonFetch(endpoint, {
      method: 'POST',
      headers: {
        ...this.getHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    }, 20000);

    if (!res.ok) {
      return { status: 'error', error: res.error };
    }
    return res.data || { status: 'success' };
  },

  async runBackup(siteUrl: string, token: string): Promise<{ status: string; message?: string; error?: string }> {
    const endpoint = this.buildUrl(siteUrl, '/backups/run', token);
    const res = await safeJsonFetch(endpoint, {
      method: 'POST',
      headers: this.getHeaders(token),
    }, 30000);

    if (!res.ok) {
      return { status: 'error', error: res.error };
    }
    return res.data || { status: 'success' };
  },

  async purgeCache(siteUrl: string, token: string): Promise<{ status: string; message?: string; error?: string }> {
    const endpoint = this.buildUrl(siteUrl, '/performance/purge', token);
    const res = await safeJsonFetch(endpoint, {
      method: 'POST',
      headers: this.getHeaders(token),
    }, 25000);

    if (!res.ok) {
      return { status: 'error', error: res.error };
    }
    return res.data || { status: 'success' };
  },

  async updateBranding(siteUrl: string, token: string, branding: { logo_url?: string; bg_color?: string; footer_text?: string }) {
    const endpoint = this.buildUrl(siteUrl, '/agency/branding', token);
    const res = await safeJsonFetch(endpoint, {
      method: 'POST',
      headers: {
        ...this.getHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(branding),
    }, 25000);

    if (!res.ok) {
      return { status: 'error', error: res.error };
    }
    return res.data || { status: 'success' };
  },

  async updateWidgets(siteUrl: string, token: string, hiddenWidgets: string[]) {
    const endpoint = this.buildUrl(siteUrl, '/admin/widgets', token);
    const res = await safeJsonFetch(endpoint, {
      method: 'POST',
      headers: {
        ...this.getHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hidden_widgets: hiddenWidgets }),
    }, 25000);

    if (!res.ok) {
      return { status: 'error', error: res.error };
    }
    return res.data || { status: 'success' };
  },
};
