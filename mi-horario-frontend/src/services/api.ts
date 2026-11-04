const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let activeJwtToken: string | null = null;
let refreshInFlight: Promise<void> | null = null;
let sessionExpiredHandler: (() => void) | null = null;

export interface CreateEmployeePayload {
  code: string;
  name: string;
  email: string;
}

export interface CreateShiftPayload {
  employeeId: string;
  jobId?: string;       // 👈 Soportado para el trabajo a realizar
  startTime: string;
  endTime: string;
  zone?: string;        // Zona seleccionada
  isRest?: boolean;     // Descanso
}

export interface UpdateShiftPayload {
  startTime?: string;
  endTime?: string;
  zone?: string;
  jobId?: string;       // 👈 Soportado para actualizar el trabajo
  isRest?: boolean;
}

export interface CreateJobPayload {
  title: string;
  description: string;
}

export interface CreateZonePayload {
  name: string;
  description: string;
  location: string;
}

export interface RegisterPayload {
  role: 'ADMIN' | 'EMPLOYEE';
  email: string;
  password: string;
  name?: string;
  code?: string;
  registrationKey?: string;
}

function getAuthHeaders(includeJson = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (activeJwtToken) {
    headers['Authorization'] = `Bearer ${activeJwtToken}`;
  }
  return headers;
}

function renewToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = api
      .refreshSession()
      .then(() => undefined)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight.then(
    () => true,
    () => false
  );
}

async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const send = () =>
    fetch(url, {
      ...init,
      headers: {
        ...((init.headers as Record<string, string>) || {}),
        ...(activeJwtToken ? { Authorization: `Bearer ${activeJwtToken}` } : {}),
      },
    });

  const hadToken = !!activeJwtToken;
  let res = await send();

  if (res.status === 401 && hadToken) {
    if (await renewToken()) {
      res = await send();
    } else {
      activeJwtToken = null;
      sessionExpiredHandler?.();
    }
  }
  return res;
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  const err = await res.json().catch(() => ({}));
  if (Array.isArray(err?.message)) {
    return err.message.join(', ');
  }
  if (typeof err?.message === 'string' && err.message.trim().length > 0) {
    return err.message;
  }
  return fallback;
}

export const api = {
  baseUrl: API_BASE_URL,

  setToken(token: string | null) {
    activeJwtToken = token;
  },

  onSessionExpired(handler: (() => void) | null) {
    sessionExpiredHandler = handler;
  },

  async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE_URL}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  },

  async register(payload: RegisterPayload): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'No fue posible completar el registro');
    }
    return res.json();
  },

  async login(
    email: string,
    password: string,
    role?: 'ADMIN' | 'EMPLOYEE'
  ): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error autenticando en el servidor');
    }
    const data = await res.json();
    if (data.accessToken) {
      activeJwtToken = data.accessToken;
    }
    return data;
  },

  async loginWithGoogleOidc(
    idToken: string,
    role?: 'ADMIN' | 'EMPLOYEE'
  ): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/auth/oidc/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ idToken, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.message || 'Error verificando id_token de Google OpenID Connect'
      );
    }
    const data = await res.json();
    if (data.accessToken) {
      activeJwtToken = data.accessToken;
    }
    return data;
  },

  async refreshSession(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      throw new Error('No fue posible renovar la sesión con el Refresh Token');
    }
    const data = await res.json();
    if (data.accessToken) {
      activeJwtToken = data.accessToken;
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
    } catch {
      // Ignorar error al cerrar sesión
    } finally {
      activeJwtToken = null;
    }
  },

  async getEmployees(): Promise<any[]> {
    const res = await authFetch(`${API_BASE_URL}/employees`);
    if (!res.ok) throw new Error(await extractErrorMessage(res, 'Error consultando empleados'));
    return res.json();
  },

  async createEmployee(payload: CreateEmployeePayload): Promise<any> {
    const res = await authFetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Error creando empleado'));
    }
    return res.json();
  },

  async getShifts(): Promise<any[]> {
    const res = await authFetch(`${API_BASE_URL}/shift`);
    if (!res.ok) throw new Error(await extractErrorMessage(res, 'Error consultando turnos'));
    return res.json();
  },

  async createShift(payload: CreateShiftPayload): Promise<any> {
    const res = await authFetch(`${API_BASE_URL}/shift`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Error creando turno'));
    }
    return res.json();
  },

  // 👈 Método añadido para actualizar turnos (PATCH /shift/:id)
  async updateShift(shiftId: string, payload: UpdateShiftPayload): Promise<any> {
    const res = await authFetch(`${API_BASE_URL}/shift/${shiftId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Error actualizando turno'));
    }
    return res.json();
  },

  async acknowledgeShift(shiftId: string): Promise<any> {
    const res = await authFetch(`${API_BASE_URL}/shift/${shiftId}/acknowledge`, {
      method: 'PATCH',
      headers: getAuthHeaders(true),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Error confirmando el turno'));
    }
    return res.json();
  },

  async getJobs(): Promise<any[]> {
    const res = await authFetch(`${API_BASE_URL}/job`);
    if (!res.ok) throw new Error(await extractErrorMessage(res, 'Error consultando puestos'));
    return res.json();
  },

  async createJob(payload: CreateJobPayload): Promise<any> {
    const res = await authFetch(`${API_BASE_URL}/job`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Error creando puesto'));
    }
    return res.json();
  },

  async getZones(): Promise<any[]> {
    const res = await authFetch(`${API_BASE_URL}/zone`);
    if (!res.ok) throw new Error(await extractErrorMessage(res, 'Error consultando zonas'));
    return res.json();
  },

  async createZone(payload: CreateZonePayload): Promise<any> {
    const res = await authFetch(`${API_BASE_URL}/zone`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Error creando zona'));
    }
    return res.json();
  },

  async getAuditLogs(): Promise<any> {
    const res = await authFetch(`${API_BASE_URL}/audit-logs`);
    if (!res.ok) throw new Error(await extractErrorMessage(res, 'Error consultando bitácora de auditoría'));
    return res.json();
  },

  async testMessageCatalog(code: string): Promise<{ resolvedMessage: string }> {
    const res = await authFetch(`${API_BASE_URL}/messages/${code}`);
    if (!res.ok) throw new Error(await extractErrorMessage(res, 'Error consultando catálogo en Redis'));
    return res.json();
  },
};