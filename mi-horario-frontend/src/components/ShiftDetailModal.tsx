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
} from 'lucide-react';
import { Shift, Employee, UserRole } from '../types/schedule';
import { api } from '../services/api';

interface ShiftDetailModalProps {
  shift: Shift | null;
  employee: Employee | null;
  userRole: UserRole;
  currentUserCode: string;
  onClose: () => void;
  onEmployeeAcknowledgeShift: (
    employeeId: string,
    day: number,
    shiftId?: string
  ) => Promise<string | undefined> | void;
  backendOnline?: boolean;
}

export const ShiftDetailModal: React.FC<ShiftDetailModalProps> = ({
  shift,
  employee,
  userRole,
  currentUserCode,
  onClose,
  onEmployeeAcknowledgeShift,
  backendOnline = true,
}) => {
  const [editLocation, setEditLocation] = useState('Zona Transporte');
  const [editJobId, setEditJobId] = useState<string>('');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [jobsList, setJobsList] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (backendOnline) {
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
      setEditLocation(shift.location || 'Zona Transporte');
      const assignedJobId = shift.jobId || (shift as any).job || '';
      setEditJobId(assignedJobId);
      setFeedbackBanner(null);
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

  const currentJobTitle =
    jobsList.find((j) => j.id === editJobId)?.title ||
    jobsList.find((j) => j.id === shift.jobId)?.title ||
    (typeof (shift as any).job === 'object' ? (shift as any).job?.title : null) ||
    (shift as any).jobTitle ||
    'Sin trabajo asignado';

  const handleConfirmAttendance = async () => {
    const backendMsg = await onEmployeeAcknowledgeShift(
      employee.id,
      shift.day,
      shift.id
    );
    setFeedbackBanner(
      backendMsg || 'Has confirmado tu asistencia para este turno.'
    );
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
                <div className="detail-label">Empleado</div>
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
                  Estado: {shift.acknowledged ? 'Confirmado por empleado' : 'Pendiente de confirmar'}
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
                    : `${shift.startTime} a ${shift.endTime} (${shift.hours}h)`}
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

          {/* Sección restaurada exclusivamente para confirmar asistencia */}
          {!isAdmin && isOwnShift && (
            <div className="role-action-panel">
              <div className="role-action-header">
                <ShieldCheck size={16} color="#ED217A" />
                <span>Gestión Personal de tu Turno</span>
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