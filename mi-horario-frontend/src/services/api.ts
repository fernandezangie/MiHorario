const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let activeJwtToken: string | null = null;

export interface CreateEmployeePayload {
  code: string;
  name: string;
  email: string;
}

export interface CreateShiftPayload {
  employeeId: string;
  jobId: string;
  startTime: string;
  endTime: string;
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

export const api = {
  baseUrl: API_BASE_URL,

  setToken(token: string | null) {
    activeJwtToken = token;
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

  async getEmployees(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/employees`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Error consultando empleados');
    return res.json();
  },

  async createEmployee(payload: CreateEmployeePayload): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error creando empleado');
    }
    return res.json();
  },

  async getShifts(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/shift`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Error consultando turnos');
    return res.json();
  },

  async createShift(payload: CreateShiftPayload): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/shift`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error creando turno');
    }
    return res.json();
  },

  async getJobs(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/job`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Error consultando puestos');
    return res.json();
  },

  async createJob(payload: CreateJobPayload): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/job`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error creando puesto');
    return res.json();
  },

  async getZones(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/zone`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Error consultando zonas');
    return res.json();
  },

  async createZone(payload: CreateZonePayload): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/zone`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error creando zona');
    return res.json();
  },

  async getAuditLogs(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/audit-logs`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Error consultando bitácora de auditoría');
    return res.json();
  },

  async testMessageCatalog(code: string): Promise<{ resolvedMessage: string }> {
    const res = await fetch(`${API_BASE_URL}/messaging/test/${code}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Error consultando catálogo en Redis');
    return res.json();
  },
};
