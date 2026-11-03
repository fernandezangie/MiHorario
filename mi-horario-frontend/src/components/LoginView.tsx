import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  User,
  Mail,
  Lock,
  KeyRound,
  BadgeCheck,
  AlertCircle,
  CheckCircle2,
  Building2,
  UserCheck,
} from 'lucide-react';
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

// Si es 'true', permite entrar con un perfil local cuando NO hay conexión con el backend
// (solo para demostraciones). Por defecto está apagado: los errores del servidor se muestran.
const ALLOW_OFFLINE_DEMO = import.meta.env.VITE_ALLOW_OFFLINE_DEMO === 'true';

// El botón de Google solo se muestra si se activa aquí Y en el backend (ENABLE_GOOGLE_LOGIN).
const GOOGLE_LOGIN_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN === 'true';

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

type Mode = 'login' | 'register';

const NO_CONNECTION_MSG =
  'No se pudo conectar con el servidor. Verifica que el backend esté en línea.';

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('EMPLOYEE');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [registrationKey, setRegistrationKey] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!GOOGLE_LOGIN_ENABLED || mode !== 'login') return;
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
          setIsSubmitting(true);

          try {
            const backendRes = await api.loginWithGoogleOidc(idToken, 'EMPLOYEE');
            if (backendRes?.user) {
              setIsSubmitting(false);
              onLoginSuccess(backendRes.user);
              return;
            }
            throw new Error('El servidor no devolvió los datos del usuario.');
          } catch (err: any) {
            const sinConexion = err instanceof TypeError;
            if (!(sinConexion && ALLOW_OFFLINE_DEMO)) {
              setIsSubmitting(false);
              setErrorMsg(
                sinConexion
                  ? NO_CONNECTION_MSG
                  : err.message || 'No fue posible iniciar sesión con Google.'
              );
              return;
            }
          }

          // Modo demostración sin backend: decodifica el id_token localmente
          const claims = decodeJwtPayload(idToken);
          const baseProfile = PROFILES.EMPLOYEE;
          setIsSubmitting(false);
          onLoginSuccess({
            ...baseProfile,
            id: claims?.sub ? `GOOGLE-${claims.sub}` : baseProfile.id,
            name: claims?.name || baseProfile.name,
            email: claims?.email || baseProfile.email,
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
  }, [onLoginSuccess, mode]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
    setRegistrationKey('');
  };

  const handleRoleSwitch = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Autenticación contra la API real del backend
      const res = await api.login(email.trim(), password);
      if (res?.user) {
        setIsSubmitting(false);
        onLoginSuccess(res.user);
        return;
      }
      setErrorMsg('El servidor no devolvió los datos del usuario.');
    } catch (err: any) {
      const sinConexion = err instanceof TypeError;
      if (sinConexion && ALLOW_OFFLINE_DEMO) {
        const lower = email.toLowerCase();
        const isEmployee = lower.includes('carlos') || lower.includes('empleado');
        const baseProfile = isEmployee ? PROFILES.EMPLOYEE : PROFILES.ADMIN;
        setIsSubmitting(false);
        onLoginSuccess({ ...baseProfile, email: email.trim() });
        return;
      }
      // Despliega directamente la respuesta/mensaje de error enviada por el servidor (ej: "El usuario no está registrado")
      setErrorMsg(
        sinConexion ? NO_CONNECTION_MSG : err.message || 'No fue posible iniciar sesión.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const isAdmin = selectedRole === 'ADMIN';

    if (isAdmin && !fullName.trim()) {
      setErrorMsg('Ingresa tu nombre completo.');
      return;
    }
    if (!email.trim() || !password) {
      setErrorMsg('Completa tu correo y contraseña.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }
    if (isAdmin && !registrationKey.trim()) {
      setErrorMsg('Ingresa la clave de registro de supervisor.');
      return;
    }
    if (!isAdmin && !employeeCode.trim()) {
      setErrorMsg('Ingresa tu código de colaborador.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.register({
        role: selectedRole,
        email: email.trim(),
        password,
        name: isAdmin ? fullName.trim() : undefined,
        code: isAdmin ? undefined : employeeCode.trim(),
        registrationKey: isAdmin ? registrationKey : undefined,
      });
      // Registro correcto: pasa al login con el correo ya escrito
      switchMode('login');
      setSuccessMsg('Registro exitoso. Ya puedes iniciar sesión.');
    } catch (err: any) {
      setErrorMsg(
        err instanceof TypeError ? NO_CONNECTION_MSG : err.message || 'No fue posible registrarte.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRegister = mode === 'register';
  const isAdminRole = selectedRole === 'ADMIN';

  return (
    <div className="minimal-login-backdrop">
      <div className="minimal-login-card">
        {/* Marca y Título Principal "Mi Horario" */}
        <div className="minimal-login-brand">
          <div className="minimal-login-icon">
            <Calendar size={28} color="#FFFFFF" />
          </div>
          <h1 className="minimal-login-title">Mi Horario</h1>
          <span className="minimal-login-subtitle">
            {isRegister ? 'Crear una cuenta nueva' : 'Plataforma Corporativa • Comfama'}
          </span>
        </div>

        {/* Selector de perfil: solo al registrarse (al entrar, el perfil lo define la base de datos) */}
        {isRegister && (
          <div className="minimal-role-pills" role="group" aria-label="Seleccionar perfil">
            <button
              type="button"
              className={`minimal-role-pill ${selectedRole === 'EMPLOYEE' ? 'active' : ''}`}
              onClick={() => handleRoleSwitch('EMPLOYEE')}
            >
              <UserCheck size={15} />
              <span>Empleado</span>
            </button>
            <button
              type="button"
              className={`minimal-role-pill ${selectedRole === 'ADMIN' ? 'active' : ''}`}
              onClick={() => handleRoleSwitch('ADMIN')}
            >
              <Building2 size={15} />
              <span>Supervisor</span>
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="minimal-login-error">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="minimal-login-success">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form
          onSubmit={isRegister ? handleRegister : handleLogin}
          className="minimal-login-form"
        >
          {isRegister && isAdminRole && (
            <div className="minimal-field-box">
              <User size={18} className="minimal-field-icon" />
              <input
                id="register-name"
                type="text"
                className="minimal-input"
                placeholder="Nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                aria-label="Nombre completo"
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className="minimal-field-box">
            <Mail size={18} className="minimal-field-icon" />
            <input
              id="login-email"
              type="email"
              className="minimal-input"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Correo electrónico"
              autoComplete="username"
              required
            />
          </div>

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
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
            />
          </div>

          {isRegister && (
            <>
              <div className="minimal-field-box">
                <Lock size={18} className="minimal-field-icon" />
                <input
                  id="register-confirm"
                  type="password"
                  className="minimal-input"
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-label="Confirmar contraseña"
                  autoComplete="new-password"
                  required
                />
              </div>
              <span className="minimal-field-hint">
                Mínimo 8 caracteres, combinando letras y números.
              </span>

              {isAdminRole ? (
                <div className="minimal-field-box">
                  <KeyRound size={18} className="minimal-field-icon" />
                  <input
                    id="register-key"
                    type="password"
                    className="minimal-input"
                    placeholder="Clave de registro de supervisor"
                    value={registrationKey}
                    onChange={(e) => setRegistrationKey(e.target.value)}
                    aria-label="Clave de registro de supervisor"
                    autoComplete="off"
                    required
                  />
                </div>
              ) : (
                <>
                  <div className="minimal-field-box">
                    <BadgeCheck size={18} className="minimal-field-icon" />
                    <input
                      id="register-code"
                      type="text"
                      className="minimal-input"
                      placeholder="Código de colaborador (ej. COM-3001)"
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                      aria-label="Código de colaborador"
                      autoComplete="off"
                      required
                    />
                  </div>
                  <span className="minimal-field-hint">
                    Debe coincidir con el código y correo con los que tu supervisor te registró.
                  </span>
                </>
              )}
            </>
          )}

          <button type="submit" className="minimal-btn-enter" disabled={isSubmitting}>
            {isSubmitting
              ? isRegister
                ? 'Registrando...'
                : 'Ingresando...'
              : isRegister
                ? 'Crear cuenta'
                : 'Entrar'}
          </button>
        </form>

        <p className="minimal-switch-mode">
          {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
          <button
            type="button"
            className="minimal-link-btn"
            onClick={() => switchMode(isRegister ? 'login' : 'register')}
          >
            {isRegister ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>

        {GOOGLE_LOGIN_ENABLED && !isRegister && (
          <>
            <div className="minimal-divider">
              <span>o</span>
            </div>
            <div className="minimal-google-wrapper">
              <div ref={googleBtnContainerRef} className="minimal-google-sdk-btn" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};