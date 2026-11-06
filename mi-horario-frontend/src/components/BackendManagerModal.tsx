import React, { useState, useEffect } from 'react';
import { X, UserPlus, CalendarPlus, MapPin, Bell, CheckCircle2, AlertCircle } from 'lucide-react';
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
  initialTab,
  onClose,
  onEmployeeCreated,
  onShiftCreated,
  employees,
  backendOnline,
}) => {
  // Catálogo de mensajes (Redis -> Backend -> Frontend)
  const { t } = useMessages();

  const [tab, setTab] = useState<ManagerTab>(initialTab);
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

  // Employee Form
  const [empCode, setEmpCode] = useState('COM-2055');
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empRole, setEmpRole] = useState('Operador Atracciones');
  const [empDept, setEmpDept] = useState('Operaciones Parque');

  // Shift Form
  const [shiftEmpId, setShiftEmpId] = useState(employees[0]?.id || 'EMP-1001');
  const [shiftDay, setShiftDay] = useState(getBogotaDay());
  const [shiftStart, setShiftStart] = useState('08:00');
  const [shiftEnd, setShiftEnd] = useState('16:00');
  const [shiftZone, setShiftZone] = useState('Zona Transporte');
  const [shiftJobId, setShiftJobId] = useState('');

  // Zone Form
  const [zoneName, setZoneName] = useState('');
  const [zoneLocation, setZoneLocation] = useState('Parque Comfama Rionegro');
  const [zoneDesc, setZoneDesc] = useState('');

  // Message Catalog Test
  const [catalogCode, setCatalogCode] = useState('EMPLOYEE_REGISTER_SUCCESS');
  const [catalogResult, setCatalogResult] = useState<string | null>(null);

  useEffect(() => {
    setStatusMsg(null);

    // Al abrir el modal, mostrar la pestaña que pidió el botón
    if (isOpen) {
      setTab(initialTab);
    }

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
  }, [isOpen, backendOnline, initialTab]);

  useEffect(() => {
    if (employees.length > 0 && !employees.some((e) => e.id === shiftEmpId)) {
      setShiftEmpId(employees[0].id);
    }
  }, [employees, shiftEmpId]);

  if (!isOpen) return null;

  // Validación flexible para reconocer si se encuentra en la pestaña de empleado ('employee' o 'employees')
  const isEmployeeTab =
    tab === 'employee' ||
    (tab as string) === 'employees' ||
    (tab as string) === 'new-employee';

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    try {
      let backendMessage: string | undefined;
      if (backendOnline) {
        const res = await (api as any).createEmployee({
          id: empCode.trim(),
          code: empCode.trim(),
          name: empName.trim(),
          email: empEmail.trim()
        });
        backendMessage = res?.message;
      }
      onEmployeeCreated({
        code: empCode.trim(),
        name: empName.trim(),
        email: empEmail.trim(),
        role: empRole,
        department: empDept,
      });
      setStatusMsg({
        type: 'ok',
        text: backendMessage || `El colaborador "${empName.trim()}" fue agregado exitosamente a la programación.`,
      });
      setEmpName('');
      setEmpEmail('');
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message || 'Error al registrar colaborador' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    try {
      let backendMessage: string | undefined;
      if (backendOnline) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const dayStr = String(shiftDay).padStart(2, '0');

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
      setStatusMsg({ type: 'err', text: err.message || 'Error al asignar turno' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    try {
      let backendMessage: string | undefined;
      if (backendOnline && typeof (api as any).createZone === 'function') {
        const res = await (api as any).createZone({ name: zoneName, description: zoneDesc, location: zoneLocation });
        backendMessage = res?.message;
      }
      setStatusMsg({
        type: 'ok',
        text: backendMessage || `Sede / Zona "${zoneName}" guardada correctamente.`,
      });
      setZoneName('');
      setZoneDesc('');
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message || 'Error creando zona' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestCatalog = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      if (backendOnline && typeof (api as any).testMessageCatalog === 'function') {
        const res = await (api as any).testMessageCatalog(catalogCode);
        setCatalogResult(res.resolvedMessage);
      } else {
        const fallback: Record<string, string> = {
          EMPLOYEE_REGISTER_SUCCESS: 'El empleado {employeeName} ha sido registrado exitosamente.',
          SHIFT_ASSIGN_SUCCESS: 'Hola {employeeName}, tienes un nuevo turno asignado para el día {date}.',
          RESTRICTION_VIOLATION: 'Alerta: Se detectó una infracción de restricción laboral para {employeeName}.',
        };
        setCatalogResult(fallback[catalogCode] || 'Plantilla no encontrada');
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message });
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
            <h3 className="modal-title">Administración de Horarios y Personal</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-tabs-bar">
          <button
            type="button"
            className={`modal-tab-btn ${tab === 'shift' ? 'active' : ''}`}
            onClick={() => { setTab('shift'); setStatusMsg(null); }}
          >
            <CalendarPlus size={15} />
            <span>Asignar Turno</span>
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${isEmployeeTab ? 'active' : ''}`}
            onClick={() => { setTab('employee'); setStatusMsg(null); }}
          >
            <UserPlus size={15} />
            <span>Nuevo Colaborador</span>
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${tab === 'zone' ? 'active' : ''}`}
            onClick={() => { setTab('zone'); setStatusMsg(null); }}
          >
            <MapPin size={15} />
            <span>Sedes y Zonas</span>
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${tab === 'catalog' ? 'active' : ''}`}
            onClick={() => { setTab('catalog'); setStatusMsg(null); }}
          >
            <Bell size={15} />
            <span>Plantillas de Aviso</span>
          </button>
        </div>

        <div className="modal-body">
          {statusMsg && (
            <div className={`status-banner ${statusMsg.type === 'ok' ? 'status-ok' : 'status-err'}`}>
              {statusMsg.type === 'ok' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {tab === 'shift' && (
            <form onSubmit={handleCreateShift} className="modal-form">
              <div className="form-group">
                <label className="detail-label">Colaborador</label>
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
                  <label className="detail-label">Hora de Entrada (06:00 - 21:00)</label>
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
                  <label className="detail-label">Hora de Salida (06:00 - 21:00)</label>
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
                {loading ? 'Guardando turno...' : 'Guardar y Publicar Turno'}
              </button>
            </form>
          )}

          {isEmployeeTab && (
            <form onSubmit={handleCreateEmployee} className="modal-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label className="detail-label">Código de Nómina</label>
                  <input
                    className="form-control"
                    value={empCode}
                    onChange={(e) => setEmpCode(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="detail-label">Correo Institucional</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="colaborador@comfama.com"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="detail-label">Nombre Completo</label>
                <input
                  className="form-control"
                  placeholder="Ej. Laura Restrepo"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  required
                />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="detail-label">Cargo Operativo</label>
                  <input
                    className="form-control"
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="detail-label">Área / Departamento</label>
                  <input
                    className="form-control"
                    value={empDept}
                    onChange={(e) => setEmpDept(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="modal-btn-primary" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrar Colaborador'}
              </button>
            </form>
          )}

          {tab === 'zone' && (
            <form onSubmit={handleCreateZone} className="modal-form">
              <div className="form-group">
                <label className="detail-label">Nombre de la Zona o Atracción</label>
                <input
                  className="form-control"
                  placeholder="Ej. Mundo Acuático / Tutucán"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="detail-label">Sede / Ubicación</label>
                <input
                  className="form-control"
                  value={zoneLocation}
                  onChange={(e) => setZoneLocation(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="detail-label">Descripción</label>
                <input
                  className="form-control"
                  placeholder="Zona húmeda y atención familiar"
                  value={zoneDesc}
                  onChange={(e) => setZoneDesc(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="modal-btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Registrar Zona'}
              </button>
            </form>
          )}

          {tab === 'catalog' && (
            <div className="modal-form">
              <p className="catalog-help-text">
                Consulta las plantillas automáticas de notificación que se envían a los colaboradores cuando se les asigna o modifica un turno:
              </p>
              <div className="form-group">
                <label className="detail-label">Tipo de Notificación</label>
                <select
                  className="form-control"
                  value={catalogCode}
                  onChange={(e) => setCatalogCode(e.target.value)}
                >
                  <option value="EMPLOYEE_REGISTER_SUCCESS">Registro de colaborador (EMPLOYEE_REGISTER_SUCCESS)</option>
                  <option value="SHIFT_ASSIGN_SUCCESS">Asignación de turno (SHIFT_ASSIGN_SUCCESS)</option>
                  <option value="SHIFT_ACKNOWLEDGE_SUCCESS">Confirmación de turno (SHIFT_ACKNOWLEDGE_SUCCESS)</option>
                  <option value="SHIFT_UPDATE_SUCCESS">Actualización de turno (SHIFT_UPDATE_SUCCESS)</option>
                  <option value="JOB_CREATED_SUCCESS">Creación de puesto (JOB_CREATED_SUCCESS)</option>
                  <option value="ZONE_CREATED_SUCCESS">Creación de zona (ZONE_CREATED_SUCCESS)</option>
                  <option value="RESTRICTION_CREATED_SUCCESS">Creación de restricción (RESTRICTION_CREATED_SUCCESS)</option>
                  <option value="SHIFT_OVERLAP_ERROR">Error de cruce de turno (SHIFT_OVERLAP_ERROR)</option>
                  <option value="EMPLOYEE_EMAIL_INVALID">Error de correo inválido (EMPLOYEE_EMAIL_INVALID)</option>
                </select>
              </div>
              <button type="button" className="modal-btn-primary" onClick={handleTestCatalog} disabled={loading}>
                Ver Plantilla de Mensaje
              </button>
              {catalogResult && (
                <div className="catalog-preview-box">
                  <strong>Vista previa del mensaje:</strong>
                  <p>{catalogResult}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};