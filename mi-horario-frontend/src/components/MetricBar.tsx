import React from 'react';
import {
  Calendar,
  UserPlus,
  CalendarPlus,
  MapPin,
  Bell,
  Search,
  LogOut,
  Building2,
  UserCheck,
  Clock,
  Coffee,
  CheckCircle2,
  Inbox,
  Users,
  User,
} from 'lucide-react';
import {
  AuthUser,
  Employee,
  ManagerTab,
  ShiftChangeRequest,
  UserRole,
} from '../types/schedule';

interface MetricBarProps {
  user: AuthUser;
  filterText: string;
  onFilterChange: (text: string) => void;
  selectedDepartment: string;
  departments: string[];
  onDepartmentChange: (dept: string) => void;
  employeeCount: number;
  ownEmployee?: Employee;
  employeeViewScope: 'OWN' | 'TEAM';
  onEmployeeViewScopeChange: (scope: 'OWN' | 'TEAM') => void;
  onConfirmAllOwnShifts: () => void;
  requests: ShiftChangeRequest[];
  onResolveRequest: (id: string, status: 'APPROVED' | 'REJECTED') => void;
  onOpenManager: (tab: ManagerTab) => void;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
}

export const MetricBar: React.FC<MetricBarProps> = ({
  user,
  filterText,
  onFilterChange,
  selectedDepartment,
  departments,
  onDepartmentChange,
  employeeCount,
  ownEmployee,
  employeeViewScope,
  onEmployeeViewScopeChange,
  onConfirmAllOwnShifts,
  requests,
  onResolveRequest,
  onOpenManager,
  onSwitchRole,
  onLogout,
}) => {
  const isAdmin = user.role === 'ADMIN';

  // Cálculos del resumen personal cuando entra como Empleado
  const ownShiftsList = ownEmployee ? Object.values(ownEmployee.shifts) : [];
  const totalMonthlyHours = ownShiftsList.reduce((acc, s) => acc + (s.hours || 0), 0);
  const totalRestDays = ownShiftsList.filter((s) => s.type === 'REST').length;
  const confirmedCount = ownShiftsList.filter((s) => s.acknowledged).length;
  const nextWorkingShift = ownShiftsList.find((s) => s.type !== 'REST');

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');

  return (
    <header className="corporate-header-wrapper">
      {/* Barra Superior Institucional */}
      <div className="corporate-topbar">
        <div className="brand-group">
          <div className="brand-logo-circle">
            <Calendar size={22} color="#FFFFFF" />
          </div>
          <div>
            <div className="brand-title-row">
              <h1 className="brand-title">MiHorario</h1>
              <span className="brand-badge">Comfama</span>
              <span className={`perspective-header-badge ${isAdmin ? 'admin' : 'employee'}`}>
                {isAdmin ? 'PERSPECTIVA SUPERVISOR' : 'PERSPECTIVA EMPLEADO'}
              </span>
            </div>
            <p className="brand-subtitle">
              {isAdmin
                ? 'Panel de Supervisión: Programación global de personal, sedes y novedades'
                : `Portal del Colaborador: Consulta de turnos personales, descansos y solicitudes`}
            </p>
          </div>
        </div>

        {/* Información de Usuario y Cambio Rápido de Perfil */}
        <div className="user-session-bar">
          <div className="role-Quick-toggle" title="Alternar entre los 2 perfiles">
            <button
              type="button"
              className={`role-pill-btn ${isAdmin ? 'active' : ''}`}
              onClick={() => onSwitchRole('ADMIN')}
            >
              <Building2 size={14} />
              <span>Perfil Supervisor</span>
            </button>
            <button
              type="button"
              className={`role-pill-btn ${!isAdmin ? 'active' : ''}`}
              onClick={() => onSwitchRole('EMPLOYEE')}
            >
              <UserCheck size={14} />
              <span>Perfil Empleado</span>
            </button>
          </div>

          <div className="user-profile-chip">
            <div className="user-avatar-small">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="user-profile-info">
              <span className="user-profile-name">
                {user.name} <small>({user.code})</small>
              </span>
              <span className="user-profile-role">
                {user.title} • {user.department}
              </span>
            </div>
          </div>

          <button type="button" className="btn-logout" onClick={onLogout} title="Cerrar sesión">
            <LogOut size={16} />
            <span>Cambiar Cuenta</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          PERSPECTIVA 1: BARRA Y HERRAMIENTAS DEL SUPERVISOR
          ==================================================================== */}
      {isAdmin ? (
        <>
          <div className="corporate-toolbar">
            <div className="toolbar-filters">
              <div className="search-box-wrapper">
                <Search size={17} className="search-box-icon" />
                <input
                  id="search-employee-input"
                  type="text"
                  className="search-input"
                  placeholder="Buscar colaborador por nombre, código o cargo..."
                  value={filterText}
                  onChange={(e) => onFilterChange(e.target.value)}
                />
              </div>

              <select
                className="department-select"
                value={selectedDepartment}
                onChange={(e) => onDepartmentChange(e.target.value)}
              >
                <option value="ALL">Todas las áreas ({employeeCount} colaboradores)</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    Área: {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="toolbar-actions">
              <button
                type="button"
                className="btn-action-primary"
                onClick={() => onOpenManager('shift')}
              >
                <CalendarPlus size={17} />
                <span>+ Asignar Turno</span>
              </button>

              <button
                type="button"
                className="btn-action-secondary"
                onClick={() => onOpenManager('employee')}
              >
                <UserPlus size={17} />
                <span>+ Nuevo Colaborador</span>
              </button>

              <button
                type="button"
                className="btn-action-outline"
                onClick={() => onOpenManager('zone')}
              >
                <MapPin size={16} />
                <span>Sedes y Zonas</span>
              </button>

              <button
                type="button"
                className="btn-action-outline"
                onClick={() => onOpenManager('catalog')}
              >
                <Bell size={16} />
                <span>Avisos</span>
              </button>
            </div>
          </div>

          {/* Bandeja de Solicitudes enviadas por Empleados (Exclusivo Supervisor) */}
          {pendingRequests.length > 0 && (
            <div className="supervisor-requests-bar">
              <div className="supervisor-req-title">
                <Inbox size={17} color="#ED217A" />
                <span>
                  Solicitudes de Empleados Pendientes ({pendingRequests.length}):
                </span>
              </div>
              <div className="supervisor-req-list">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="supervisor-req-item">
                    <span>
                      <strong>{req.employeeName}</strong> ({req.employeeCode}) • Día {req.day} ({req.currentSchedule}):{' '}
                      <em>"{req.reason}"</em>
                    </span>
                    <div className="supervisor-req-actions">
                      <button
                        type="button"
                        className="btn-req-approve"
                        onClick={() => onResolveRequest(req.id, 'APPROVED')}
                      >
                        Aprobar y dar Libre
                      </button>
                      <button
                        type="button"
                        className="btn-req-reject"
                        onClick={() => onResolveRequest(req.id, 'REJECTED')}
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* ====================================================================
           PERSPECTIVA 2: RESUMEN Y CONTROLES DEL EMPLEADO
           ==================================================================== */
        <div className="employee-perspective-container">
          <div className="employee-summary-cards">
            <div className="emp-stat-card">
              <div className="emp-stat-icon">
                <Calendar size={18} color="#ED217A" />
              </div>
              <div>
                <div className="emp-stat-label">Próximo Turno Programado</div>
                <div className="emp-stat-value">
                  {nextWorkingShift
                    ? `Día ${nextWorkingShift.day} • ${nextWorkingShift.startTime} - ${nextWorkingShift.endTime}`
                    : 'Sin turnos pendientes'}
                </div>
                <div className="emp-stat-sub">
                  {nextWorkingShift?.location ?? 'Parque Comfama Rionegro'}
                </div>
              </div>
            </div>

            <div className="emp-stat-card">
              <div className="emp-stat-icon">
                <Clock size={18} color="#ED217A" />
              </div>
              <div>
                <div className="emp-stat-label">Mis Horas del Mes</div>
                <div className="emp-stat-value">{totalMonthlyHours} horas</div>
                <div className="emp-stat-sub">Programación mensual de 30 días</div>
              </div>
            </div>

            <div className="emp-stat-card">
              <div className="emp-stat-icon">
                <Coffee size={18} color="#ED217A" />
              </div>
              <div>
                <div className="emp-stat-label">Días de Descanso (LIBRE)</div>
                <div className="emp-stat-value">{totalRestDays} días libres</div>
                <div className="emp-stat-sub">Compensatorios y dominicales</div>
              </div>
            </div>

            <div className="emp-stat-card">
              <div className="emp-stat-icon">
                <CheckCircle2 size={18} color="#ED217A" />
              </div>
              <div>
                <div className="emp-stat-label">Turnos Confirmados</div>
                <div className="emp-stat-value">
                  {confirmedCount} / {ownShiftsList.length} días
                </div>
                <div className="emp-stat-sub">
                  Solicitudes enviadas: {requests.filter((r) => r.employeeCode === user.code).length}
                </div>
              </div>
            </div>
          </div>

          <div className="employee-toolbar-row">
            <div className="employee-scope-selector">
              <button
                type="button"
                className={`scope-btn ${employeeViewScope === 'OWN' ? 'active' : ''}`}
                onClick={() => onEmployeeViewScopeChange('OWN')}
              >
                <User size={15} />
                <span>Ver solo mi horario ({user.name})</span>
              </button>
              <button
                type="button"
                className={`scope-btn ${employeeViewScope === 'TEAM' ? 'active' : ''}`}
                onClick={() => onEmployeeViewScopeChange('TEAM')}
              >
                <Users size={15} />
                <span>Ver compañeros de mi área ({user.department})</span>
              </button>
            </div>

            <div className="employee-quick-actions">
              <span className="employee-click-tip">
                💡 Haz clic en cualquier día de tu fila para <strong>confirmar asistencia</strong> o <strong>pedir un cambio de turno</strong>.
              </span>
              <button
                type="button"
                className="btn-action-primary"
                onClick={onConfirmAllOwnShifts}
              >
                <CheckCircle2 size={16} />
                <span>Confirmar Todo Mi Mes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
