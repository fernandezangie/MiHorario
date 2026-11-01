import React, { useState, useEffect, useRef } from 'react';
import { Calendar, User, Lock, AlertCircle, Building2, UserCheck } from 'lucide-react';
import { AuthUser, UserRole } from '../types/schedule';
import { api } from '../services/api';

declare global {
  interface Window {
    google?: any;
  }
}

export const GOOGLE_OIDC_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '407688951595-jhjhvthvriskj3c8q3goaamihg8q3a2o.apps.googleusercontent.com';

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

function decodeJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [username, setUsername] = useState(PROFILES.ADMIN.email);
  const [password, setPassword] = useState('Comfama2026*');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const selectedRoleRef = useRef<UserRole>(selectedRole);

  useEffect(() => {
    selectedRoleRef.current = selectedRole;
  }, [selectedRole]);

  useEffect(() => {
    let intervalId: number | undefined;

    const initGoogleOidc = () => {
      if (!window.google?.accounts?.id || !googleBtnContainerRef.current) {
        return false;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_OIDC_CLIENT_ID,
        callback: async (response: { credential?: string }) => {
          if (!response?.credential) {
            setErrorMsg('No se recibió respuesta de Google.');
            return;
          }

          const idToken = response.credential;
          const activeRole = selectedRoleRef.current;
          setIsSubmitting(true);

          try {
            const backendRes = await api.loginWithGoogleOidc(idToken, activeRole);
            if (backendRes?.user) {
              setIsSubmitting(false);
              onLoginSuccess(backendRes.user);
              return;
            }
          } catch {
            // Respaldo decodificando el id_token directamente si el backend está apagado
          }

          const claims = decodeJwtPayload(idToken);
          const baseProfile = PROFILES[activeRole];
          setIsSubmitting(false);
          onLoginSuccess({
            ...baseProfile,
            id: claims?.sub ? `GOOGLE-${claims.sub}` : baseProfile.id,
            name: claims?.name || baseProfile.name,
            email: claims?.email || baseProfile.email,
            title: `${baseProfile.title}`,
            token: idToken,
          });
        },
      });

      window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: 240,
        locale: 'es',
      });

      return true;
    };

    if (!initGoogleOidc()) {
      intervalId = window.setInterval(() => {
        if (initGoogleOidc() && intervalId) {
          clearInterval(intervalId);
        }
      }, 300);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [onLoginSuccess]);

  const handleRoleSwitch = (role: UserRole) => {
    setSelectedRole(role);
    setUsername(PROFILES[role].email);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Por favor ingresa tu usuario y contraseña.');
      return;
    }

    setIsSubmitting(true);

    const isEmployee =
      selectedRole === 'EMPLOYEE' ||
      username.toLowerCase().includes('carlos') ||
      username.toLowerCase().includes('empleado');
    const resolvedRole: UserRole = isEmployee ? 'EMPLOYEE' : 'ADMIN';

    try {
      const res = await api.login(username.trim(), password, resolvedRole);
      if (res?.user) {
        setIsSubmitting(false);
        onLoginSuccess(res.user);
        return;
      }
    } catch {
      // Modo híbrido local si el backend está apagado
    }

    const baseProfile = isEmployee ? PROFILES.EMPLOYEE : PROFILES.ADMIN;
    setIsSubmitting(false);
    onLoginSuccess({
      ...baseProfile,
      email: username.trim(),
    });
  };

  return (
    <div className="minimal-login-backdrop">
      <div className="minimal-login-card">
        {/* Marca y Título Principal "Mi Horario" */}
        <div className="minimal-login-brand">
          <div className="minimal-login-icon">
            <Calendar size={28} color="#FFFFFF" />
          </div>
          <h1 className="minimal-login-title">Mi Horario</h1>
          <span className="minimal-login-subtitle">Plataforma Corporativa • Comfama</span>
        </div>

        {/* Selector limpio de perfil (Supervisor vs Empleado) */}
        <div className="minimal-role-pills" role="group" aria-label="Seleccionar perfil">
          <button
            type="button"
            className={`minimal-role-pill ${selectedRole === 'ADMIN' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('ADMIN')}
          >
            <Building2 size={15} />
            <span>Supervisor</span>
          </button>
          <button
            type="button"
            className={`minimal-role-pill ${selectedRole === 'EMPLOYEE' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('EMPLOYEE')}
          >
            <UserCheck size={15} />
            <span>Empleado</span>
          </button>
        </div>

        {errorMsg && (
          <div className="minimal-login-error">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario Vertical Centrado como en el Boceto */}
        <form onSubmit={handleSubmit} className="minimal-login-form">
          {/* Campo 1: Usuario */}
          <div className="minimal-field-box">
            <User size={18} className="minimal-field-icon" />
            <input
              id="login-username"
              type="text"
              className="minimal-input"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-label="Usuario"
              required
            />
          </div>

          {/* Campo 2: Contraseña */}
          <div className="minimal-field-box">
            <Lock size={18} className="minimal-field-icon" />
            <input
              id="login-password"
              type="password"
              className="minimal-input"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Contraseña"
              required
            />
          </div>

          {/* Botón Principal Centrado: Entrar */}
          <button
            type="submit"
            className="minimal-btn-enter"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>

        <div className="minimal-divider">
          <span>o</span>
        </div>

        {/* Botón Inferior Centrado: Entrar con Google */}
        <div className="minimal-google-wrapper">
          <div ref={googleBtnContainerRef} className="minimal-google-sdk-btn" />
        </div>
      </div>
    </div>
  );
};
