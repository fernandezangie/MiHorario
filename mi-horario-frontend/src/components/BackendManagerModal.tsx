import React, { useState, useEffect } from 'react';
import { X, UserPlus, CalendarPlus, MapPin, Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Employee, ManagerTab } from '../types/schedule';

interface BackendManagerModalProps {
  isOpen: boolean;
  initialTab: ManagerTab;
  onClose: () => void;
  onEmployeeCreated: (emp: { code: string; name: string; email: string; role: string; department: string }) => void;
  onShiftCreated: (shift: { employeeId: string; day: number; startTime: string; endTime: string; location: string }) => void;
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
  const [tab, setTab] = useState<ManagerTab>(initialTab);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTab(initialTab);
    setStatusMsg(null);
  }, [initialTab, isOpen]);

  // Employee Form
  const [empCode, setEmpCode] = useState('COM-2055');
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empRole, setEmpRole] = useState('Operador Atracciones');
  const [empDept, setEmpDept] = useState('Operaciones Parque');

  // Shift Form
  const [shiftEmpId, setShiftEmpId] = useState(employees[0]?.id || 'EMP-1001');
  const [shiftDay, setShiftDay] = useState(1);
  const [shiftStart, setShiftStart] = useState('08:00');
  const [shiftEnd, setShiftEnd] = useState('16:00');
  const [shiftZone, setShiftZone] = useState('Sede Parque Rionegro');

  // Zone Form
  const [zoneName, setZoneName] = useState('');
  const [zoneLocation, setZoneLocation] = useState('Parque Comfama Rionegro');
  const [zoneDesc, setZoneDesc] = useState('');

  // Message Catalog Test
  const [catalogCode, setCatalogCode] = useState('SHIFT_ASSIGNED');
  const [catalogResult, setCatalogResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    try {
      if (backendOnline) {
        await api.createEmployee({ code: empCode, name: empName, email: empEmail });
      }
      onEmployeeCreated({
        code: empCode,
        name: empName,
        email: empEmail,
        role: empRole,
        department: empDept,
      });
      setStatusMsg({
        type: 'ok',
        text: `El colaborador "${empName}" fue agregado exitosamente a la programación.`,
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
      if (backendOnline) {
        const dayStr = shiftDay.toString().padStart(2, '0');
        await api.createShift({
          employeeId: shiftEmpId,
          jobId: 'JOB-DEFAULT',
          startTime: `2026-10-${dayStr}T${shiftStart}:00.000Z`,
          endTime: `2026-10-${dayStr}T${shiftEnd}:00.000Z`,
        });
      }
      onShiftCreated({
        employeeId: shiftEmpId,
        day: Number(shiftDay),
        startTime: shiftStart,
        endTime: shiftEnd,
        location: shiftZone,
      });
      const empObj = employees.find((item) => item.id === shiftEmpId);
      setStatusMsg({
        type: 'ok',
        text: `Turno asignado a ${empObj?.name || shiftEmpId} para el Día ${shiftDay} (${shiftStart} - ${shiftEnd}).`,
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
      if (backendOnline) {
        await api.createZone({ name: zoneName, description: zoneDesc, location: zoneLocation });
      }
      setStatusMsg({
        type: 'ok',
        text: `Sede / Zona "${zoneName}" guardada correctamente.`,
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
      if (backendOnline) {
        const res = await api.testMessageCatalog(catalogCode);
        setCatalogResult(res.resolvedMessage);
      } else {
        const fallback: Record<string, string> = {
          EMPLOYEE_CREATED: 'El empleado {employeeName} ha sido registrado exitosamente.',
          SHIFT_ASSIGNED: 'Hola {employeeName}, tienes un nuevo turno asignado para el día {date}.',
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

        {/* Pestañas claras */}
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
            className={`modal-tab-btn ${tab === 'employee' ? 'active' : ''}`}
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
                  <label className="detail-label">Día del Mes (1-30)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    className="form-control"
                    value={shiftDay}
                    onChange={(e) => setShiftDay(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="detail-label">Hora de Entrada</label>
                  <input
                    type="time"
                    className="form-control"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="detail-label">Hora de Salida</label>
                  <input
                    type="time"
                    className="form-control"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="detail-label">Sede o Zona Asignada</label>
                <input
                  className="form-control"
                  value={shiftZone}
                  onChange={(e) => setShiftZone(e.target.value)}
                />
              </div>
              <button type="submit" className="modal-btn-primary" disabled={loading}>
                {loading ? 'Guardando turno...' : 'Guardar y Publicar Turno'}
              </button>
            </form>
          )}

          {tab === 'employee' && (
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
                  <option value="SHIFT_ASSIGNED">Nuevo turno asignado (SHIFT_ASSIGNED)</option>
                  <option value="EMPLOYEE_CREATED">Bienvenida de colaborador (EMPLOYEE_CREATED)</option>
                  <option value="RESTRICTION_VIOLATION">Alerta de novedad laboral (RESTRICTION_VIOLATION)</option>
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
