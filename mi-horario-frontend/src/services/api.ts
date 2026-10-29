const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

export const api = {
  baseUrl: API_BASE_URL,

  async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE_URL}/`, { signal: controller.signal });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  },

  async getEmployees(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/employees`);
    if (!res.ok) throw new Error('Error consultando empleados');
    return res.json();
  },

  async createEmployee(payload: CreateEmployeePayload): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error creando empleado');
    }
    return res.json();
  },

  async getShifts(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/shift`);
    if (!res.ok) throw new Error('Error consultando turnos');
    return res.json();
  },

  async createShift(payload: CreateShiftPayload): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/shift`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error creando turno');
    }
    return res.json();
  },

  async getJobs(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/job`);
    if (!res.ok) throw new Error('Error consultando puestos');
    return res.json();
  },

  async createJob(payload: CreateJobPayload): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/job`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error creando puesto');
    return res.json();
  },

  async getZones(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/zone`);
    if (!res.ok) throw new Error('Error consultando zonas');
    return res.json();
  },

  async createZone(payload: CreateZonePayload): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/zone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error creando zona');
    return res.json();
  },

  async testMessageCatalog(code: string): Promise<{ resolvedMessage: string }> {
    const res = await fetch(`${API_BASE_URL}/messaging/test/${code}`);
    if (!res.ok) throw new Error('Error consultando catálogo en Redis');
    return res.json();
  },
};

