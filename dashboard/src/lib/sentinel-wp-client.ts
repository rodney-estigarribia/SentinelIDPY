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

export const sentinelWpClient = {
  getHeaders(token: string) {
    return {
      'User-Agent': 'SentinelIDPY-AdminPlatform/1.0',
      'X-WF-Report-Token': token,
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
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
        cache: 'no-store'
      });
      clearTimeout(timeoutId);
      const responseTimeMs = Date.now() - start;
      return {
        isUp: res.status >= 200 && res.status < 400,
        statusCode: res.status,
        responseTimeMs
      };
    } catch (err: any) {
      return {
        isUp: false,
        statusCode: 0,
        responseTimeMs: Date.now() - start,
        error: err.message || 'Connection failed'
      };
    }
  },

  async fetchStats(siteUrl: string, token: string): Promise<WPStatsResponse | null> {
    const endpoint = `${siteUrl.replace(/\/+$/, '')}/wp-json/sentinel/v1/stats?_=${Date.now()}`;
    try {
      const res = await fetch(endpoint, {
        headers: this.getHeaders(token),
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn(`Failed to fetch stats from ${siteUrl}:`, e);
      return null;
    }
  },

  async fetchUpdates(siteUrl: string, token: string): Promise<WPPendingUpdatesResponse | null> {
    const endpoint = `${siteUrl.replace(/\/+$/, '')}/wp-json/sentinel/v1/updates?_=${Date.now()}`;
    try {
      const res = await fetch(endpoint, {
        headers: this.getHeaders(token),
        cache: 'no-store'
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn(`Failed to fetch updates from ${siteUrl}:`, e);
      return null;
    }
  },

  async applyUpdates(
    siteUrl: string,
    token: string,
    params: { type: 'all' | 'core' | 'plugins' | 'themes'; slugs?: string[] }
  ): Promise<{ status: string; results?: any; error?: string }> {
    const endpoint = `${siteUrl.replace(/\/+$/, '')}/wp-json/sentinel/v1/updates/apply`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...this.getHeaders(token),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params),
        cache: 'no-store'
      });
      return await res.json();
    } catch (e: any) {
      return { status: 'error', error: e.message };
    }
  },

  async fetchPlugins(siteUrl: string, token: string): Promise<WPPluginItem[]> {
    const endpoint = `${siteUrl.replace(/\/+$/, '')}/wp-json/sentinel/v1/plugins?_=${Date.now()}`;
    try {
      const res = await fetch(endpoint, {
        headers: this.getHeaders(token),
        cache: 'no-store'
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.plugins || [];
    } catch (e) {
      return [];
    }
  },

  async installPlugin(
    siteUrl: string,
    token: string,
    payload: { slug?: string; zipUrl?: string; activate?: boolean }
  ): Promise<{ status: string; message?: string; error?: string }> {
    const endpoint = `${siteUrl.replace(/\/+$/, '')}/wp-json/sentinel/v1/plugins/install`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...this.getHeaders(token),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        cache: 'no-store'
      });
      return await res.json();
    } catch (e: any) {
      return { status: 'error', error: e.message };
    }
  },

  async togglePlugin(
    siteUrl: string,
    token: string,
    slug: string,
    action: 'activate' | 'deactivate'
  ): Promise<{ status: string; error?: string }> {
    const endpoint = `${siteUrl.replace(/\/+$/, '')}/wp-json/sentinel/v1/plugins/toggle`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...this.getHeaders(token),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ slug, action }),
        cache: 'no-store'
      });
      return await res.json();
    } catch (e: any) {
      return { status: 'error', error: e.message };
    }
  },

  async fetchUsers(siteUrl: string, token: string): Promise<WPUserItem[]> {
    const endpoint = `${siteUrl.replace(/\/+$/, '')}/wp-json/sentinel/v1/users?_=${Date.now()}`;
    try {
      const res = await fetch(endpoint, {
        headers: this.getHeaders(token),
        cache: 'no-store'
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.users || [];
    } catch (e) {
      return [];
    }
  },

  async resetUserPassword(siteUrl: string, token: string, userId: number): Promise<{ status: string; message?: string; error?: string }> {
    const endpoint = `${siteUrl.replace(/\/+$/, '')}/wp-json/sentinel/v1/users/reset-password`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...this.getHeaders(token),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId }),
        cache: 'no-store'
      });
      return await res.json();
    } catch (e: any) {
      return { status: 'error', error: e.message };
    }
  },

  async runBackup(siteUrl: string, token: string): Promise<{ status: string; message?: string }> {
    const endpoint = `${siteUrl.replace(/\/+$/, '')}/wp-json/sentinel/v1/backups/run`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(token),
        cache: 'no-store'
      });
      return await res.json();
    } catch (e: any) {
      return { status: 'error', message: e.message };
    }
  },

  async purgeCache(siteUrl: string, token: string): Promise<{ status: string; message?: string }> {
    const endpoint = `${siteUrl.replace(/\/+$/, '')}/wp-json/sentinel/v1/performance/purge`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(token),
        cache: 'no-store'
      });
      return await res.json();
    } catch (e: any) {
      return { status: 'error', message: e.message };
    }
  },

  async updateBranding(siteUrl: string, token: string, branding: { logo_url?: string; bg_color?: string; footer_text?: string }) {
    const endpoint = `${siteUrl.replace(/\/+$/, '')}/wp-json/sentinel/v1/agency/branding`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...this.getHeaders(token),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(branding),
        cache: 'no-store'
      });
      return await res.json();
    } catch (e: any) {
      return { status: 'error', message: e.message };
    }
  },

  async updateWidgets(siteUrl: string, token: string, hiddenWidgets: string[]) {
    const endpoint = `${siteUrl.replace(/\/+$/, '')}/wp-json/sentinel/v1/admin/widgets`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...this.getHeaders(token),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ hidden_widgets: hiddenWidgets }),
        cache: 'no-store'
      });
      return await res.json();
    } catch (e: any) {
      return { status: 'error', message: e.message };
    }
  }
};
