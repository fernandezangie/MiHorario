import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useMessages } from '../hooks/useMessages';
import { Employee, ManagerTab } from '../types/schedule';

// Día actual en zona horaria de Bogotá (evita desfases con la zona del navegador)
const getBogotaDay = () =>
  parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Bogota',
      day: 'numeric',
    }).format(new Date()),
    10,
  );

interface BackendManagerModalProps {
  isOpen: boolean;
  initialTab: ManagerTab;
  onClose: () => void;
  onEmployeeCreated: (emp: { code: string; name: string; email: string; role: string; department: string }) => void;
  onShiftCreated: (shift: { employeeId: string; day: number; startTime: string; endTime: string; location: string; jobId?: string }) => void;
  employees: Employee[];
  backendOnline: boolean;
}

export const BackendManagerModal: React.FC<BackendManagerModalProps> = ({
  isOpen,
  onClose,
  onShiftCreated,
  employees,
  backendOnline,
}) => {
  // Catálogo de mensajes (Redis -> Backend -> Frontend)
  const { t } = useMessages();

  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados para las zonas dinámicas desde la BD
  const [zonesList, setZonesList] = useState<string[]>([
    'Zona Transporte',
    'Casa De Convenciones',
    'Zona norte',
    'Espacios de Educación',
    'Administración',
    'Zona 2',
    'Zona Húmeda',
    'Tutucán',
  ]);

  // Estados para los trabajos (jobs) dinámicos desde la BD
  const [jobsList, setJobsList] = useState<Array<{ id: string; title: string }>>([]);

  // Shift Form
  const [shiftEmpId, setShiftEmpId] = useState(employees[0]?.id || 'EMP-1001');
  const [shiftDay, setShiftDay] = useState(getBogotaDay());
  const [shiftStart, setShiftStart] = useState('08:00');
  const [shiftEnd, setShiftEnd] = useState('16:00');
  const [shiftZone, setShiftZone] = useState('Zona Transporte');
  const [shiftJobId, setShiftJobId] = useState('');

  useEffect(() => {
    setStatusMsg(null);

    // Cargar catálogos reales del backend al abrir el modal si está online
    const fetchCatalogsFromDb = async () => {
      if (backendOnline) {
        try {
          if (typeof api.getZones === 'function') {
            const data = await api.getZones();
            if (Array.isArray(data) && data.length > 0) {
              const formattedZones = data.map((z: any) => (typeof z === 'object' ? z.name : z));
              setZonesList(formattedZones);
              setShiftZone((prev) =>
                formattedZones.includes(prev) ? prev : formattedZones[0],
              );
            }
          }
        } catch (err) {
          console.error('No se pudieron cargar las zonas de la BD, usando respaldo:', err);
        }

        try {
          if (typeof api.getJobs === 'function') {
            const jobsData = await api.getJobs();
            if (Array.isArray(jobsData)) {
              setJobsList(jobsData);
            }
          }
        } catch (err) {
          console.error('No se pudieron cargar los trabajos de la BD:', err);
        }
      }
    };

    if (isOpen) {
      fetchCatalogsFromDb();
    }
  }, [isOpen, backendOnline]);

  useEffect(() => {
    if (employees.length > 0 && !employees.some((e) => e.id === shiftEmpId)) {
      setShiftEmpId(employees[0].id);
    }
  }, [employees, shiftEmpId]);

  if (!isOpen) return null;

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const dayStr = String(shiftDay).padStart(2, '0');

      let backendMessage: string | undefined;
      if (backendOnline) {
        // Formato con offset local de Colombia (-05:00)
        const startTime = `${currentYear}-${currentMonth}-${dayStr}T${shiftStart}:00-05:00`;
        const endTime = `${currentYear}-${currentMonth}-${dayStr}T${shiftEnd}:00-05:00`;

        const res = await api.createShift({
          employeeId: shiftEmpId,
          startTime,
          endTime,
          zone: shiftZone,
          jobId: shiftJobId || undefined,
        });
        backendMessage = res?.message;
      }

      onShiftCreated({
        employeeId: shiftEmpId,
        day: Number(shiftDay),
        startTime: shiftStart,
        endTime: shiftEnd,
        location: shiftZone,
        jobId: shiftJobId || undefined,
      });

      const nombreMes = new Date().toLocaleDateString('es-ES', { month: 'long' });
      const empObj = employees.find((item) => item.id === shiftEmpId);
      const jobObj = jobsList.find((item) => item.id === shiftJobId);

      setStatusMsg({
        type: 'ok',
        text:
          backendMessage ||
          t('SHIFT_ASSIGN_SUCCESS') ||
          `Turno asignado a ${empObj?.name || shiftEmpId} para el ${shiftDay} de ${nombreMes} (${shiftStart} a ${shiftEnd}) en ${shiftZone}${jobObj ? ` [Trabajo: ${jobObj.title}]` : ''}.`,
      });
    } catch (err: any) {
      // Aquí se muestra el mensaje que viene del backend (catálogo de Redis)
      setStatusMsg({ type: 'err', text: err.message || 'Error al asignar turno' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '600px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="badge-pill badge-surcharge">Gestión Operativa</span>
            <h3 className="modal-title">Asignación de Turnos</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {statusMsg && (
            <div className={`status-banner ${statusMsg.type === 'ok' ? 'status-ok' : 'status-err'}`}>
              {statusMsg.type === 'ok' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleCreateShift} className="modal-form">
            <div className="form-group">
              <label className="detail-label">Empleado</label>
              <select
                className="form-control"
                value={shiftEmpId}
                onChange={(e) => setShiftEmpId(e.target.value)}
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.code} • {e.department})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label className="detail-label">Día del Mes</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  className="form-control"
                  value={shiftDay}
                  onChange={(e) => setShiftDay(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="detail-label">Hora de Entrada </label>
                <input
                  type="time"
                  min="06:00"
                  max="21:00"
                  className="form-control"
                  value={shiftStart}
                  onChange={(e) => setShiftStart(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="detail-label">Hora de Salida</label>
                <input
                  type="time"
                  min="06:00"
                  max="21:00"
                  className="form-control"
                  value={shiftEnd}
                  onChange={(e) => setShiftEnd(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="detail-label">Zona Asignada</label>
                <select
                  className="form-control"
                  value={shiftZone}
                  onChange={(e) => setShiftZone(e.target.value)}
                >
                  {zonesList.map((zone, idx) => (
                    <option key={idx} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="detail-label">Trabajo Asignado</label>
                <select
                  className="form-control"
                  value={shiftJobId}
                  onChange={(e) => setShiftJobId(e.target.value)}
                >
                  <option value="">Selecciona un trabajo...</option>
                  {jobsList.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="modal-btn-primary" disabled={loading}>
              {loading ? 'Guardando turno...' : 'Guardar y enviar turno'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};