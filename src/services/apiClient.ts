import { ISyncSessionConfig } from '@/interfaces/ISync';

const LS_API_URL_KEY = 'smart_market_api_url';
const LS_TOKEN_KEY = 'smart_market_token';
const LS_REFRESH_TOKEN_KEY = 'smart_market_refresh_token';
const LS_LIST_ID_KEY = 'smart_market_list_id';

interface IRefreshResponse {
  err: string | null;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
}

interface ILoginResponse {
  err: string | null;
  msg: string;
  userData?: {
    token: string;
    refreshToken?: string;
    expiresIn?: number;
    name: string;
    email: string;
    validate: boolean;
  };
}

function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decodedJson = window.atob(padded);
    const payload = JSON.parse(decodedJson) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function isTokenExpiringSoon(token: string, bufferSeconds = 60): boolean {
  const exp = decodeJwtExp(token);
  if (!exp) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return exp - nowSeconds <= bufferSeconds;
}

class ApiClient {
  private refreshInFlight: Promise<boolean> | null = null;

  getSession(): Required<ISyncSessionConfig> {
    let apiUrl = process.env.VUE_APP_API_URL || '';
    let token = '';
    let refreshToken = '';
    let listId = '';

    if (typeof window !== 'undefined') {
      try {
        apiUrl = window.localStorage.getItem(LS_API_URL_KEY) || apiUrl;
        token = window.localStorage.getItem(LS_TOKEN_KEY) || '';
        refreshToken = window.localStorage.getItem(LS_REFRESH_TOKEN_KEY) || '';
        listId = window.localStorage.getItem(LS_LIST_ID_KEY) || '';
      } catch {
        // Ignora indisponibilidade de localStorage
      }
    }

    return {
      apiUrl: apiUrl.replace(/\/+$/, ''),
      token,
      refreshToken,
      listId,
    };
  }

  setSession(config: ISyncSessionConfig): void {
    if (typeof window === 'undefined') return;
    try {
      if (config.apiUrl !== undefined) {
        window.localStorage.setItem(LS_API_URL_KEY, config.apiUrl);
      }
      if (config.token !== undefined) {
        window.localStorage.setItem(LS_TOKEN_KEY, config.token);
      }
      if (config.refreshToken !== undefined) {
        window.localStorage.setItem(LS_REFRESH_TOKEN_KEY, config.refreshToken);
      }
      if (config.listId !== undefined) {
        window.localStorage.setItem(LS_LIST_ID_KEY, config.listId);
      }
    } catch {
      // Ignora indisponibilidade
    }
  }

  clearAuthTokens(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(LS_TOKEN_KEY);
      window.localStorage.removeItem(LS_REFRESH_TOKEN_KEY);
    } catch {
      // Ignora indisponibilidade
    }
  }

  hasAuthenticatedSession(): boolean {
    const { apiUrl, token, refreshToken } = this.getSession();
    return Boolean(apiUrl && (token || refreshToken));
  }

  /**
   * Renova silenciosamente o Access Token usando o cookie HttpOnly de 30 dias
   * (com fallback via refreshToken para PWAs mobile cross-origin), usando trava single-flight.
   */
  async refreshSession(): Promise<boolean> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    this.refreshInFlight = this.performRefresh().finally(() => {
      this.refreshInFlight = null;
    });

    return this.refreshInFlight;
  }

  private async performRefresh(): Promise<boolean> {
    const { apiUrl, refreshToken } = this.getSession();
    if (!apiUrl) return false;

    const response = await fetch(`${apiUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    });

    if (response.status === 401 || response.status === 403) {
      // Refresh token de 30 dias expirou ou foi revogado no servidor
      this.clearAuthTokens();
      return false;
    }

    if (!response.ok) {
      throw new Error(`REFRESH_HTTP_${response.status}`);
    }

    const data = (await response.json()) as IRefreshResponse;
    if (!data.token) {
      return false;
    }

    this.setSession({
      token: data.token,
      refreshToken: data.refreshToken ?? refreshToken,
    });
    return true;
  }

  /**
   * Interceptor central: renova preventivamente antes de vencer e refaz automaticamente em caso de 401.
   */
  async authenticatedFetch(
    path: string,
    init: RequestInit = {}
  ): Promise<Response> {
    let session = this.getSession();
    if (!session.apiUrl) {
      throw new Error('NO_API_URL');
    }

    if (!session.token || isTokenExpiringSoon(session.token)) {
      const renewed = await this.refreshSession();
      if (renewed) {
        session = this.getSession();
      }
    }

    const executeCall = (bearerToken: string) => {
      const mergedHeaders = new Headers(init.headers || {});
      if (!mergedHeaders.has('Content-Type') && init.body) {
        mergedHeaders.set('Content-Type', 'application/json');
      }
      if (bearerToken) {
        mergedHeaders.set('Authorization', `Bearer ${bearerToken}`);
      }

      return fetch(`${session.apiUrl}${path}`, {
        ...init,
        credentials: 'include',
        headers: mergedHeaders,
      });
    };

    const firstResponse = await executeCall(session.token);
    if (firstResponse.status !== 401) {
      return firstResponse;
    }

    // Recebeu 401: renova silenciosamente e repete a requisição sem interromper o usuário
    const refreshed = await this.refreshSession();
    if (!refreshed) {
      return firstResponse;
    }

    const updatedSession = this.getSession();
    return executeCall(updatedSession.token);
  }

  async login(email: string, password: string): Promise<ILoginResponse> {
    const { apiUrl } = this.getSession();
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = (await res.json()) as ILoginResponse;
    if (res.ok && data.userData?.token) {
      this.setSession({
        token: data.userData.token,
        refreshToken: data.userData.refreshToken || '',
      });
    }
    return data;
  }

  async logout(): Promise<void> {
    const { apiUrl, refreshToken } = this.getSession();
    this.clearAuthTokens();
    if (!apiUrl) return;

    try {
      await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      });
    } catch {
      // Caso esteja offline no momento do logout, os tokens locais já foram removidos
    }
  }
}

export const apiClient = new ApiClient();
