import { Shift, ShiftType } from '../types/schedule';

// El calendario del frontend usa dinámicamente el año y mes actual del sistema (Noviembre de 2026)
const now = new Date();
const SCHEDULE_YEAR = now.getFullYear();
const SCHEDULE_MONTH = now.getMonth() + 1; // 11 para Noviembre
const BOGOTA_OFFSET = '-05:00'; // Colombia no usa horario de verano
const BOGOTA_TZ = 'America/Bogota';

function unwrap(v: any): any {
  return v && typeof v === 'object' && 'value' in v ? v.value : v;
}

/**
 * Convierte "día del mes + hora de entrada/salida (hora Colombia)" en fechas ISO
 * que el backend entiende. Si la salida es igual o anterior a la entrada
 * (turno nocturno, p. ej. 18:00 a 02:00), la salida cae al día siguiente.
 */
export function buildShiftRange(
  day: number,
  start: string,
  end: string,
): { startTime: string; endTime: string } {
  const mm = String(SCHEDULE_MONTH).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const base = `${SCHEDULE_YEAR}-${mm}-${dd}`;

  const startDate = new Date(`${base}T${start}:00${BOGOTA_OFFSET}`);
  let endDate = new Date(`${base}T${end}:00${BOGOTA_OFFSET}`);
  if (endDate.getTime() <= startDate.getTime()) {
    endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
  }
  return { startTime: startDate.toISOString(), endTime: endDate.toISOString() };
}

/** Calcula horas y tipo de turno. */
export function classifyShift(
  start: string,
  end: string,
): { hours: number; type: ShiftType } {
  const startH = parseInt(start.split(':')[0], 10) || 8;
  const endH = parseInt(end.split(':')[0], 10) || 16;
  const hours = endH >= startH ? endH - startH : 24 - startH + endH;
  let type: ShiftType = 'ORDINARY';
  if (hours > 10) type = 'OVERTIME';
  else if (startH >= 18 || endH <= 6) type = 'SURCHARGE';
  return { hours, type };
}

function bogotaParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOGOTA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    time: `${get('hour')}:${get('minute')}`,
  };
}

/**
 * Convierte una fila de GET /shift en un turno del calendario.
 */
export function shiftFromBackend(row: any): Shift | null {
  const employeeId = unwrap(row?.employeeId);
  const start = new Date(unwrap(row?.startTime));
  const end = new Date(unwrap(row?.endTime));
  if (!employeeId || isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  const s = bogotaParts(start);
  const e = bogotaParts(end);

  if (s.year !== SCHEDULE_YEAR || s.month !== SCHEDULE_MONTH) return null;

  const { hours, type } = classifyShift(s.time, e.time);
  const dd = String(s.day).padStart(2, '0');

  // Evaluamos de forma robusta si la zona viene como objeto con nombre, texto directo, o ID
  const zoneField = row?.zone || row?.location || row?.zoneName || row?.zoneId;
  let resolvedLocation = 'Zona Transporte';

  if (typeof zoneField === 'object' && zoneField !== null) {
    resolvedLocation = zoneField.name || zoneField.title || 'Zona Transporte';
  } else if (typeof zoneField === 'string' && zoneField.trim() !== '') {
    resolvedLocation = zoneField;
  }

  // 👈 Extracción robusta del jobId (soporta objeto relation, string directo, job_id, etc.)
  const jobField = row?.jobId || row?.job_id || row?.job;
  let resolvedJobId = '';
  if (typeof jobField === 'object' && jobField !== null) {
    resolvedJobId = jobField.id || '';
  } else if (typeof jobField === 'string') {
    resolvedJobId = jobField;
  }

  return {
    id: String(unwrap(row?.id) ?? `SHIFT-${employeeId}-D${s.day}`),
    employeeId: String(employeeId),
    day: s.day,
    dateStr: `${SCHEDULE_YEAR}-${String(SCHEDULE_MONTH).padStart(2, '0')}-${dd}`,
    startTime: s.time,
    endTime: e.time,
    type,
    hours,
    label: `Turno (${hours}h)`,
    location: resolvedLocation,
    jobId: resolvedJobId, // 👈 Ahora el frontend recibirá y recordará el ID del trabajo
    acknowledged: row?.acknowledged ?? row?.isAcknowledged ?? false,
  };
}