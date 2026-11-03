import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  MapPin,
  Briefcase,
  User,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Send,
  Edit3,
  Save,
} from 'lucide-react';
import { Shift, Employee, UserRole } from '../types/schedule';
import { api } from '../services/api';

interface ShiftDetailModalProps {
  shift: Shift | null;
  employee: Employee | null;
  userRole: UserRole;
  currentUserCode: string;
  onClose: () => void;
  onSupervisorUpdateShift: (updated: {
    employeeId: string;
    day: number;
    startTime: string;
    endTime: string;
    location: string;
    jobId: string;
    isRest: boolean;
  }) => void;
  onEmployeeAcknowledgeShift: (employeeId: string, day: number, shiftId?: string) => void;
  onEmployeeRequestChange: (payload: {
    employeeId: string;
    employeeName: string;
    employeeCode: string;
    day: number;
    dateStr: string;
    currentSchedule: string;
    reason: string;
  }) => void;
  backendOnline?: boolean;
}

export const ShiftDetailModal: React.FC<ShiftDetailModalProps> = ({
  shift,
  employee,
  userRole,
  currentUserCode,
  onClose,
  onSupervisorUpdateShift,
  onEmployeeAcknowledgeShift,
  onEmployeeRequestChange,
  backendOnline = true,
}) => {
  const [editStart, setEditStart] = useState('06:00');
  const [editEnd, setEditEnd] = useState('14:00');
  const [editLocation, setEditLocation] = useState('Zona Transporte');
  const [editJobId, setEditJobId] = useState<string>('');
  const [isRestDay, setIsRestDay] = useState(false);
  const [changeReason, setChangeReason] = useState('Cita médica programada');
  const [customNote, setCustomNote] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Estados para las zonas y trabajos dinámicos de la base de datos
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

  const [jobsList, setJobsList] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    // Cargar zonas y trabajos de la base de datos al abrir el modal
    const fetchData = async () => {
      if (backendOnline) {
        try {
          if (typeof api.getZones === 'function') {
            const data = await api.getZones();
            if (Array.isArray(data) && data.length > 0) {
              const formattedZones = data.map((z: any) => (typeof z === 'object' ? z.name : z));
              setZonesList(formattedZones);
            }
          }
        } catch (err) {
          console.error('Error al cargar zonas:', err);
        }

        try {
          if (typeof api.getJobs === 'function') {
            const jobsData = await api.getJobs();
            if (Array.isArray(jobsData)) {
              setJobsList(jobsData);
            }
          }
        } catch (err) {
          console.error('Error al cargar trabajos:', err);
        }
      }
    };

    if (shift) {
      setEditStart(shift.startTime === '-' ? '06:00' : shift.startTime);
      setEditEnd(shift.endTime === '-' ? '14:00' : shift.endTime);
      setEditLocation(shift.location || 'Zona Transporte');

      // Capturamos correctamente el ID del trabajo asignado actual
      const assignedJobId = shift.jobId || (shift as any).job || '';
      setEditJobId(assignedJobId);

      setIsRestDay(shift.type === 'REST');
      setFeedbackBanner(null);
      setCustomNote('');
      fetchData();
    }
  }, [shift, backendOnline]);

  if (!shift || !employee) return null;

  const isAdmin = userRole === 'ADMIN';
  const isOwnShift = employee.code === currentUserCode;

  const getTypeLabel = (type: Shift['type']) => {
    switch (type) {
      case 'ORDINARY':
        return { text: 'Jornada Ordinaria', color: 'badge-ordinary' };
      case 'SURCHARGE':
        return { text: 'Recargo Nocturno / Dominical', color: 'badge-surcharge' };
      case 'OVERTIME':
        return { text: 'Exceso de Jornada (Horas Extra)', color: 'badge-overtime' };
      case 'REST':
        return { text: 'Día de Descanso / Compensatorio', color: 'badge-rest' };
    }
  };

  const typeInfo = getTypeLabel(shift.type);

  // Encontrar el título del trabajo actual para mostrarlo en modo lectura
  const currentJobTitle =
    jobsList.find((j) => j.id === editJobId)?.title ||
    jobsList.find((j) => j.id === shift.jobId)?.title ||
    (typeof (shift as any).job === 'object' ? (shift as any).job?.title : null) ||
    (shift as any).jobTitle ||
    'Sin trabajo asignado';

  const handleSaveSupervisorChanges = (e: React.FormEvent) => {
    e.preventDefault();
    onSupervisorUpdateShift({
      employeeId: employee.id,
      day: shift.day,
      startTime: editStart,
      endTime: editEnd,
      location: editLocation,
      jobId: editJobId,
      isRest: isRestDay,
    });
    // Actualizamos localmente el turno para reflejar el cambio de inmediato
    shift.location = editLocation;
    shift.jobId = editJobId;
    setFeedbackBanner('Horario y trabajo actualizados correctamente en la malla.');
  };

  const handleConfirmAttendance = () => {
    onEmployeeAcknowledgeShift(employee.id, shift.day, shift.id);
    setFeedbackBanner('Has confirmado tu asistencia para este turno.');
  };

  const handleSendChangeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const fullReason = customNote.trim()
      ? `${changeReason}: ${customNote.trim()}`
      : changeReason;

    onEmployeeRequestChange({
      employeeId: employee.id,
      employeeName: employee.name,
      employeeCode: employee.code,
      day: shift.day,
      dateStr: shift.dateStr,
      currentSchedule:
        shift.type === 'REST'
          ? 'Día Libre'
          : `${shift.startTime} - ${shift.endTime} (${shift.hours}h)`,
      reason: fullReason,
    });
    setFeedbackBanner(
      'Solicitud enviada al Supervisor. Puedes verla en tu contador de solicitudes.'
    );
    setCustomNote('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
              <span className={`badge-pill ${typeInfo.color}`}>{typeInfo.text}</span>
              <span className="perspective-pill-tag">
                {isAdmin ? 'Acciones de Supervisor' : 'Acciones de Empleado'}
              </span>
            </div>
            <h3 className="modal-title">
              Día {shift.day} • {shift.label}
            </h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {feedbackBanner && (
            <div className="role-action-feedback">
              <CheckCircle2 size={16} />
              <span>{feedbackBanner}</span>
            </div>
          )}

          <div className="detail-grid-2col">
            <div className="detail-item">
              <User size={18} className="detail-icon" />
              <div>
                <div className="detail-label">Colaborador</div>
                <div className="detail-val">
                  {employee.name} ({employee.code})
                </div>
                <div className="detail-sub">
                  {employee.role} • {employee.department}
                </div>
              </div>
            </div>

            <div className="detail-item">
              <Calendar size={18} className="detail-icon" />
              <div>
                <div className="detail-label">Fecha Programada</div>
                <div className="detail-val">
                  {shift.dateStr} (Día {shift.day})
                </div>
                <div className="detail-sub">
                  Estado: {shift.acknowledged ? 'Confirmado por empleado ✓' : 'Pendiente de confirmar'}
                </div>
              </div>
            </div>

            <div className="detail-item">
              <Clock size={18} className="detail-icon" />
              <div>
                <div className="detail-label">Horario Asignado</div>
                <div className="detail-val font-mono">
                  {shift.type === 'REST'
                    ? 'DÍA LIBRE (Descanso)'
                    : `${shift.startTime} - ${shift.endTime} (${shift.hours}h)`}
                </div>
              </div>
            </div>

            <div className="detail-item">
              <MapPin size={18} className="detail-icon" />
              <div>
                <div className="detail-label">Zona Asignada</div>
                <div className="detail-val">{editLocation}</div>
              </div>
            </div>

            <div className="detail-item" style={{ gridColumn: 'span 2' }}>
              <Briefcase size={18} className="detail-icon" />
              <div>
                <div className="detail-label">Trabajo Asignado</div>
                <div className="detail-val">{currentJobTitle}</div>
              </div>
            </div>
          </div>

          {/* ==========================================================
              PERSPECTIVA 1: SUPERVISOR (MODIFICAR / REASIGNAR)
              ========================================================== */}
          {isAdmin && (
            <form onSubmit={handleSaveSupervisorChanges} className="role-action-panel">
              <div className="role-action-header">
                <Edit3 size={16} color="#ED217A" />
                <span>Modificar o Reasignar este Turno (Exclusivo Supervisor)</span>
              </div>

              <label className="rest-day-toggle">
                <input
                  type="checkbox"
                  checked={isRestDay}
                  onChange={(e) => setIsRestDay(e.target.checked)}
                />
                <span>Asignar este día como Descanso / Libre remunerado</span>
              </label>

              {!isRestDay && (
                <div className="role-form-row">
                  <div className="role-field">
                    <label>Hora Entrada (06:00 - 21:00)</label>
                    <input
                      type="time"
                      min="06:00"
                      max="21:00"
                      value={editStart}
                      onChange={(e) => setEditStart(e.target.value)}
                      required
                    />
                  </div>
                  <div className="role-field">
                    <label>Hora Salida (06:00 - 21:00)</label>
                    <input
                      type="time"
                      min="06:00"
                      max="21:00"
                      value={editEnd}
                      onChange={(e) => setEditEnd(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="role-form-row">
                <div className="role-field">
                  <label>Zona Asignada</label>
                  <select
                    className="form-control"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                  >
                    {zonesList.map((zone, idx) => (
                      <option key={idx} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="role-field">
                  <label>Trabajo Asignado</label>
                  <select
                    className="form-control"
                    value={editJobId}
                    onChange={(e) => setEditJobId(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
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

              <button type="submit" className="btn-role-submit">
                <Save size={16} />
                <span>Guardar Cambios en el Turno</span>
              </button>
            </form>
          )}

          {/* ==========================================================
              PERSPECTIVA 2: EMPLEADO (CONFIRMAR ASISTENCIA O PEDIR CAMBIO)
              ========================================================== */}
          {!isAdmin && isOwnShift && (
            <div className="role-action-panel">
              <div className="role-action-header">
                <ShieldCheck size={16} color="#ED217A" />
                <span>Gestión Personal de tu Turno (Vista Empleado)</span>
              </div>

              <div className="employee-confirm-row">
                <div>
                  <strong>Confirmación de enterado</strong>
                  <p>Notifica a tu supervisor que ya revisaste este horario.</p>
                </div>
                <button
                  type="button"
                  className={`btn-confirm-shift ${shift.acknowledged ? 'confirmed' : ''}`}
                  onClick={handleConfirmAttendance}
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {shift.acknowledged ? 'Turno Confirmado' : 'Confirmar Enterado'}
                  </span>
                </button>
              </div>

              <form onSubmit={handleSendChangeRequest} className="employee-request-form">
                <strong>2. ¿Necesitas solicitar un cambio o permiso en este día?</strong>
                <div className="role-form-row">
                  <div className="role-field">
                    <label>Motivo de la solicitud</label>
                    <select
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                    >
                      <option value="Cita médica programada">Cita médica programada</option>
                      <option value="Cambio de turno con compañero">Cambio de turno con compañero</option>
                      <option value="Permiso académico / Estudio">Permiso académico / Estudio</option>
                      <option value="Calamidad doméstica">Calamidad doméstica</option>
                    </select>
                  </div>
                  <div className="role-field">
                    <label>Observación opcional</label>
                    <input
                      type="text"
                      placeholder="Ej. Cambio acordado con Ana Martínez"
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-role-submit">
                  <Send size={15} />
                  <span>Enviar Solicitud al Supervisor</span>
                </button>
              </form>
            </div>
          )}

          {!isAdmin && !isOwnShift && (
            <div className="role-readonly-notice">
              <ShieldCheck size={16} color="#ED217A" />
              <span>
                Estás consultando el turno de un compañero de tu área en <strong>modo solo lectura</strong>.
              </span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn-primary" onClick={onClose}>
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};