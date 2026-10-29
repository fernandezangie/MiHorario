import React, { useState } from 'react';
import {
  Calendar,
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Building2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { AuthUser, UserRole } from '../types/schedule';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const PROFILES: Record<UserRole, AuthUser> = {
  ADMIN: {
    id: 'ADM-001',
    code: 'SUP-0100',
    name: 'Daniela Gómez',
    email: 'daniela.gomez@comfama.com',
    role: 'ADMIN',
    title: 'Supervisora de Operaciones',
    department: 'Dirección Parque Rionegro',
    token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.admin-session',
  },
  EMPLOYEE: {
    id: 'EMP-1001',
    code: 'COM-2000',
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@comfama.com',
    role: 'EMPLOYEE',
    title: 'Operador de Atracciones',
    department: 'Operaciones Parque',
    token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.employee-session',
  },
};

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [email, setEmail] = useState(PROFILES.ADMIN.email);
  const [password, setPassword] = useState('••••••••••••');
  const [captchaVerified, setCaptchaVerified] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectProfile = (role: UserRole) => {
    setSelectedRole(role);
    setEmail(PROFILES[role].email);
    setErrorMsg(null);
  };

  const handleQuickEnter = (role: UserRole) => {
    setSelectedRole(role);
    setEmail(PROFILES[role].email);
    onLoginSuccess(PROFILES[role]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!captchaVerified) {
      setErrorMsg('Por favor confirma la verificación de seguridad antes de ingresar.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Ingresa tu correo corporativo y contraseña.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const isEmployee =
        selectedRole === 'EMPLOYEE' ||
        email.toLowerCase().includes('carlos') ||
        email.toLowerCase().includes('empleado');

      const baseProfile = isEmployee ? PROFILES.EMPLOYEE : PROFILES.ADMIN;
      setIsSubmitting(false);
      onLoginSuccess({
        ...baseProfile,
        email: email.trim(),
      });
    }, 250);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Panel Izquierdo Corporativo */}
        <div className="login-brand-panel">
          <div className="login-brand-header">
            <div className="login-logo-box">
              <Calendar size={28} color="#ED217A" />
            </div>
            <span className="login-brand-tag">Comfama • Gestión Operativa</span>
          </div>

          <div className="login-brand-Body">
            <h1 className="login-hero-title">MiHorario</h1>
            <p className="login-hero-subtitle">
              Plataforma corporativa para la programación de turnos, consulta de agendas y gestión de sedes operativas.
            </p>

            <div className="login-feature-list">
              <div className="login-feature-item">
                <span className="login-feature-dot" />
                <span>
                  <strong>Perspectiva Supervisor:</strong> administra toda la malla, asigna turnos, crea sedes y aprueba solicitudes.
                </span>
              </div>
              <div className="login-feature-item">
                <span className="login-feature-dot" />
                <span>
                  <strong>Perspectiva Empleado:</strong> consulta tu horario mensual, confirma asistencia y solicita cambios de turno.
                </span>
              </div>
              <div className="login-feature-item">
                <span className="login-feature-dot" />
                <span>
                  <strong>Control de Acceso (RBAC):</strong> vistas y permisos diferenciados según el perfil corporativo.
                </span>
              </div>
            </div>
          </div>

          <div className="login-brand-footer">
            <span>Protección de Datos Personales • Ley 1581 de 2012 (Habeas Data)</span>
          </div>
        </div>

        {/* Panel Derecho Formulario de Acceso */}
        <div className="login-form-panel">
          <div className="login-form-header">
            <h2>Selecciona un perfil para ingresar</h2>
            <p>Elige entre el perfil de Supervisor o el perfil de Empleado para explorar cada perspectiva</p>
          </div>

          {/* Tarjetas de los 2 Perfiles */}
          <div className="profile-cards-grid">
            {/* Perfil 1: Supervisor */}
            <div
              className={`profile-access-card ${selectedRole === 'ADMIN' ? 'active' : ''}`}
              onClick={() => handleSelectProfile('ADMIN')}
            >
              <div className="profile-card-top">
                <div className="profile-icon-badge admin">
                  <Building2 size={18} />
                </div>
                <span className="profile-role-tag">PERFIL SUPERVISOR</span>
              </div>
              <div className="profile-person-name">{PROFILES.ADMIN.name}</div>
              <div className="profile-person-role">{PROFILES.ADMIN.title}</div>
              <ul className="profile-perms-list">
                <li><CheckCircle2 size={12} /> Ver y filtrar los 50 empleados</li>
                <li><CheckCircle2 size={12} /> Asignar y editar turnos</li>
                <li><CheckCircle2 size={12} /> Crear empleados, sedes y avisos</li>
                <li><CheckCircle2 size={12} /> Aprobar solicitudes de cambio</li>
              </ul>
              <button
                type="button"
                className="btn-profile-quick"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickEnter('ADMIN');
                }}
              >
                Entrar como Supervisor
              </button>
            </div>

            {/* Perfil 2: Empleado */}
            <div
              className={`profile-access-card ${selectedRole === 'EMPLOYEE' ? 'active' : ''}`}
              onClick={() => handleSelectProfile('EMPLOYEE')}
            >
              <div className="profile-card-top">
                <div className="profile-icon-badge employee">
                  <UserCheck size={18} />
                </div>
                <span className="profile-role-tag">PERFIL EMPLEADO</span>
              </div>
              <div className="profile-person-name">{PROFILES.EMPLOYEE.name}</div>
              <div className="profile-person-role">
                {PROFILES.EMPLOYEE.title} ({PROFILES.EMPLOYEE.code})
              </div>
              <ul className="profile-perms-list">
                <li><CheckCircle2 size={12} /> Ver resumen de horas y descansos</li>
                <li><CheckCircle2 size={12} /> Consultar su horario personal</li>
                <li><CheckCircle2 size={12} /> Confirmar enterado de sus turnos</li>
                <li><CheckCircle2 size={12} /> Solicitar cambios o permisos</li>
              </ul>
              <button
                type="button"
                className="btn-profile-quick"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickEnter('EMPLOYEE');
                }}
              >
                Entrar como Empleado
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="login-alert-error">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="login-email">Correo institucional</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre.apellido@comfama.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="login-password">Contraseña</label>
                <a href="#recover" onClick={(e) => e.preventDefault()} className="forgot-link">
                  ¿Olvidaste tu clave?
                </a>
              </div>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                />
              </div>
            </div>

            <label className="security-check-box">
              <input
                type="checkbox"
                checked={captchaVerified}
                onChange={(e) => setCaptchaVerified(e.target.checked)}
              />
              <ShieldCheck size={18} color="#ED217A" />
              <div className="security-check-text">
                <strong>Verificación de seguridad activa</strong>
                <span>Protección corporativa de sesión</span>
              </div>
            </label>

            <button type="submit" className="btn-corporate-primary login-submit-btn" disabled={isSubmitting}>
              <span>
                {isSubmitting
                  ? 'Verificando identidad...'
                  : `Iniciar Sesión como ${selectedRole === 'ADMIN' ? 'Supervisor' : 'Empleado'}`}
              </span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
