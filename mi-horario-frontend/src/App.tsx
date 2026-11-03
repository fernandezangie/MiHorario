import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  generateMockEmployees,
  generateShiftsForEmployee,
  AVATAR_COLORS,
} from './utils/mockGenerator';
import { MetricBar } from './components/MetricBar';
import { ColorLegend } from './components/ColorLegend';
import { VirtualizedGrid } from './components/VirtualizedGrid';
import { ShiftDetailModal } from './components/ShiftDetailModal';
import { BackendManagerModal } from './components/BackendManagerModal';
import { LoginView, PROFILES } from './components/LoginView';
import {
  AuthUser,
  Employee,
  ManagerTab,
  Shift,
  ShiftChangeRequest,
  ShiftType,
  UserRole,
} from './types/schedule';
import { api } from './services/api';
import { classifyShift, shiftFromBackend } from './utils/shiftMapper';

const DEMO_MODE = import.meta.env.VITE_ALLOW_OFFLINE_DEMO === 'true';
const TOTAL_EMPLOYEES = 50;
const TOTAL_DAYS = 30;

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [filterText, setFilterText] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [employeeViewScope, setEmployeeViewScope] = useState<'OWN' | 'TEAM'>('OWN');
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [managerTab, setManagerTab] = useState<ManagerTab>('shift');

  const [employees, setEmployees] = useState<Employee[]>(() =>
    generateMockEmployees(TOTAL_EMPLOYEES, TOTAL_DAYS)
  );

  // Persistencia local para las solicitudes de cambio de turno / día libre
  const [shiftRequests, setShiftRequests] = useState<ShiftChangeRequest[]>(() => {
    const saved = localStorage.getItem('comfama_shift_requests');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fallback */ }
    }
    return [
      {
        id: 'REQ-INIT-1',
        employeeId: 'EMP-1001',
        employeeName: 'Carlos Rodríguez',
        employeeCode: 'COM-2000',
        day: 4,
        dateStr: '2026-11-04',
        currentSchedule: '06:00 - 14:00',
        reason: 'Cita médica programada: Control odontológico a las 09:00 AM',
        status: 'PENDING',
        createdAt: 'Hace 15 min',
      },
    ];
  });

  const syncWithBackend = useCallback(async () => {
    const isUp = await api.checkBackendHealth();
    setBackendOnline(isUp);
    if (!isUp) return;

    try {
      const [dbEmployees, dbShifts] = await Promise.all([
        api.getEmployees(),
        api.getShifts().catch(() => []),
      ]);

      if (Array.isArray(dbEmployees) && dbEmployees.length > 0) {
        const unwrap = (v: any) =>
          v && typeof v === 'object' && 'value' in v ? v.value : v;

        const shiftsByEmployee = new Map<string, Record<number, Shift>>();
        (Array.isArray(dbShifts) ? dbShifts : []).forEach((row: any) => {
          const shift = shiftFromBackend(row);
          if (!shift) return;
          const bucket = shiftsByEmployee.get(shift.employeeId) ?? {};
          bucket[shift.day] = shift;
          shiftsByEmployee.set(shift.employeeId, bucket);
        });

        const realEmployees: Employee[] = dbEmployees.map(
          (dbEmp: any, idx: number) => {
            const id = String(unwrap(dbEmp.id));
            return {
              id,
              code: String(unwrap(dbEmp.code) ?? id),
              name: unwrap(dbEmp.name) ?? 'Colaborador Comfama',
              email: unwrap(dbEmp.email),
              role: 'Operador Parque',
              department: 'Operaciones Parque',
              avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
              shifts: shiftsByEmployee.get(id) ?? {},
            };
          }
        );
        setEmployees(realEmployees);
      }
    } catch {
      // Conserva la programación en memoria si el backend no responde
    }
  }, []);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  useEffect(() => {
    if (currentUser) syncWithBackend();
  }, [currentUser?.id, syncWithBackend]);

  useEffect(() => {
    api.onSessionExpired(() => setCurrentUser(null));
    return () => api.onSessionExpired(null);
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
  };

  const days = useMemo(() => {
    return Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);
  }, []);

  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => set.add(e.department));
    return Array.from(set);
  }, [employees]);

  const ownEmployeeRecord = useMemo(() => {
    if (!currentUser) return undefined;
    const found = employees.find(
      (e) =>
        e.code.toLowerCase() === currentUser.code.toLowerCase() ||
        e.name.toLowerCase() === currentUser.name.toLowerCase()
    );
    if (found) return found;

    return {
      id: currentUser.code,
      code: currentUser.code,
      name: currentUser.name,
      email: `${currentUser.code.toLowerCase()}@comfama.com`,
      role: currentUser.title,
      department: currentUser.department,
      avatarColor: '#ED217A',
      shifts: generateShiftsForEmployee(currentUser.code, 1, TOTAL_DAYS),
    };
  }, [employees, currentUser]);

  const filteredEmployees = useMemo(() => {
    if (!currentUser) return [];

    if (currentUser.role === 'EMPLOYEE') {
      if (employeeViewScope === 'OWN') {
        return ownEmployeeRecord ? [ownEmployeeRecord] : [];
      }

      const targetDept = ownEmployeeRecord?.department ?? currentUser.department;
      const areaPeers = employees.filter((e) => e.department === targetDept);
      if (ownEmployeeRecord && !areaPeers.some((e) => e.code === ownEmployeeRecord.code)) {
        return [ownEmployeeRecord, ...areaPeers];
      }
      return areaPeers.length > 0 ? areaPeers : (ownEmployeeRecord ? [ownEmployeeRecord] : []);
    }

    return employees.filter((emp) => {
      const matchesDept =
        selectedDepartment === 'ALL' || emp.department === selectedDepartment;
      if (!matchesDept) return false;

      if (!filterText.trim()) return true;
      const query = filterText.toLowerCase();
      return (
        emp.name.toLowerCase().includes(query) ||
        emp.role.toLowerCase().includes(query) ||
        emp.department.toLowerCase().includes(query) ||
        emp.code.toLowerCase().includes(query)
      );
    });
  }, [
    employees,
    filterText,
    selectedDepartment,
    currentUser,
    employeeViewScope,
    ownEmployeeRecord,
  ]);

  const handleShiftClick = (shift: Shift, employee: Employee) => {
    setSelectedShift(shift);
    setSelectedEmployee(employee);
  };

  const handleOpenManager = (tab: ManagerTab) => {
    setManagerTab(tab);
    setIsManagerOpen(true);
  };

  const handleSwitchRole = (newRole: UserRole) => {
    setCurrentUser(PROFILES[newRole]);
  };

  const handleSupervisorUpdateShift = async (updated: {
    employeeId: string;
    day: number;
    startTime: string;
    endTime: string;
    location: string;
    jobId: string;
    isRest: boolean;
  }) => {
    const startH = parseInt(updated.startTime.split(':')[0], 10) || 6;
    const endH = parseInt(updated.endTime.split(':')[0], 10) || 14;

    const hours = updated.isRest
      ? 0
      : endH >= startH
      ? endH - startH
      : 24 - startH + endH;

    let type: ShiftType = 'ORDINARY';
    if (updated.isRest) type = 'REST';
    else if (hours > 10) type = 'OVERTIME';
    else if (startH >= 18 || endH <= 6) type = 'SURCHARGE';

    // 1. Actualizamos el estado visual local de inmediato
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== updated.employeeId) return emp;
        const newShiftObj: Shift = {
          ...emp.shifts[updated.day],
          startTime: updated.isRest ? '-' : updated.startTime,
          endTime: updated.isRest ? '-' : updated.endTime,
          type,
          hours,
          label: updated.isRest
            ? 'Día Libre / Descanso'
            : `Turno Modificado (${hours}h)`,
          location: updated.isRest ? 'No aplica' : updated.location,
          jobId: updated.jobId,
        };
        setSelectedShift(newShiftObj);
        return {
          ...emp,
          shifts: {
            ...emp.shifts,
            [updated.day]: newShiftObj,
          },
        };
      })
    );

    // 2. Sincronizamos la actualización, la zona y el trabajo con el backend
    try {
      if (backendOnline) {
        const targetEmp = employees.find((e) => e.id === updated.employeeId);
        const targetShift = targetEmp?.shifts[updated.day];

        if (targetShift?.id) {
          const tokenData = localStorage.getItem('token') || localStorage.getItem('access_token');
          const cleanToken = tokenData?.startsWith('"') ? JSON.parse(tokenData) : tokenData;

          const response = await fetch(`http://localhost:3000/shift/${targetShift.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${cleanToken}`,
            },
            body: JSON.stringify({
              startTime: updated.isRest ? null : updated.startTime,
              endTime: updated.isRest ? null : updated.endTime,
              isRest: updated.isRest,
              zone: updated.location,
              location: updated.location,
              jobId: updated.jobId,
            }),
          });

          if (!response.ok) {
            throw new Error('Fallo al actualizar el turno en el backend');
          }
          console.log('Turno, zona y trabajo actualizados en la base de datos correctamente.');
        }
      }
    } catch (err) {
      console.error('Error al sincronizar la actualización del turno con el backend:', err);
    }
  };

  const handleEmployeeAcknowledgeShift = async (employeeId: string, day: number) => {
    const targetEmp = employees.find((e) => e.id === employeeId);
    const targetShift = targetEmp?.shifts[day];

    try {
      if (backendOnline && targetShift?.id) {
        await api.acknowledgeShift(targetShift.id);
      }
    } catch (err) {
      console.error('Error persistiendo la confirmación en el backend:', err);
    }

    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== employeeId) return emp;
        const updatedShift: Shift = {
          ...emp.shifts[day],
          acknowledged: true,
        };
        setSelectedShift(updatedShift);
        return {
          ...emp,
          shifts: {
            ...emp.shifts,
            [day]: updatedShift,
          },
        };
      })
    );

    await syncWithBackend();
  };

  const handleConfirmAllOwnShifts = async () => {
    if (!ownEmployeeRecord) return;

    try {
      if (backendOnline) {
        await Promise.all(
          Object.values(ownEmployeeRecord.shifts).map((s) => {
            if (s.id && !s.acknowledged) {
              return api.acknowledgeShift(s.id).catch(() => {});
            }
            return Promise.resolve();
          })
        );
      }
    } catch (err) {
      console.error('Error confirmando todos los turnos:', err);
    }

    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== ownEmployeeRecord.id) return emp;
        const ackedShifts: Record<number, Shift> = {};
        Object.entries(emp.shifts).forEach(([dayKey, s]) => {
          ackedShifts[Number(dayKey)] = { ...s, acknowledged: true };
        });
        return {
          ...emp,
          shifts: ackedShifts,
        };
      })
    );

    await syncWithBackend();
  };

  const handleEmployeeRequestChange = (payload: {
    employeeId: string;
    employeeName: string;
    employeeCode: string;
    day: number;
    dateStr: string;
    currentSchedule: string;
    reason: string;
  }) => {
    const newReq: ShiftChangeRequest = {
      id: `REQ-${Date.now().toString().slice(-4)}`,
      ...payload,
      status: 'PENDING',
      createdAt: 'Justo ahora',
    };

    setShiftRequests((prev) => {
      const updated = [newReq, ...prev];
      localStorage.setItem('comfama_shift_requests', JSON.stringify(updated));
      return updated;
    });
  };

  const handleResolveRequest = async (
    reqId: string,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    const targetReq = shiftRequests.find((r) => r.id === reqId);

    setShiftRequests((prev) => {
      const updated = prev.map((r) => (r.id === reqId ? { ...r, status } : r));
      localStorage.setItem('comfama_shift_requests', JSON.stringify(updated));
      return updated;
    });

    if (status === 'APPROVED' && targetReq) {
      handleSupervisorUpdateShift({
        employeeId: targetReq.employeeId,
        day: targetReq.day,
        startTime: '-',
        endTime: '-',
        location: 'No aplica',
        jobId: '',
        isRest: true,
      });

      try {
        if (backendOnline) {
          const targetEmp = employees.find((e) => e.id === targetReq.employeeId);
          const targetShift = targetEmp?.shifts[targetReq.day];

          if (targetShift?.id) {
            if (typeof (api as any).updateShift === 'function') {
              await (api as any).updateShift(targetShift.id, {
                startTime: null,
                endTime: null,
                isRest: true,
              });
            } else {
              const tokenData = localStorage.getItem('token') || localStorage.getItem('access_token');
              const cleanToken = tokenData?.startsWith('"') ? JSON.parse(tokenData) : tokenData;

              const response = await fetch(`http://localhost:3000/shift/${targetShift.id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${cleanToken}`,
                },
                body: JSON.stringify({
                  startTime: null,
                  endTime: null,
                  isRest: true,
                }),
              });

              if (!response.ok) {
                throw new Error('Fallo al actualizar el turno en el backend');
              }
            }
          }
        }
      } catch (err) {
        console.error('Error al sincronizar la aprobación con el backend:', err);
      }
    }
  };

  const handleEmployeeCreated = (newEmp: {
    code: string;
    name: string;
    email: string;
    role: string;
    department: string;
  }) => {
    const id = newEmp.code;
    const created: Employee = {
      id,
      code: newEmp.code,
      name: newEmp.name,
      email: newEmp.email,
      role: newEmp.role,
      department: newEmp.department,
      avatarColor: '#ED217A',
      shifts: backendOnline
        ? {}
        : generateShiftsForEmployee(id, employees.length + 1, TOTAL_DAYS),
    };
    setEmployees((prev) => [created, ...prev]);
  };

  const handleShiftCreated = async (newShift: {
    employeeId: string;
    day: number;
    startTime: string;
    endTime: string;
    location: string;
    jobId?: string;
  }) => {
    const { hours, type } = classifyShift(newShift.startTime, newShift.endTime);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const dayStr = String(newShift.day).padStart(2, '0');

    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== newShift.employeeId) return emp;
        return {
          ...emp,
          shifts: {
            ...emp.shifts,
            [newShift.day]: {
              id: `SHIFT-${emp.id}-D${newShift.day}-${Date.now()}`,
              employeeId: emp.id,
              day: newShift.day,
              dateStr: `${currentYear}-${currentMonth}-${dayStr}`,
              startTime: newShift.startTime,
              endTime: newShift.endTime,
              type,
              hours,
              label: `Turno Asignado (${hours}h)`,
              location: newShift.location,
              jobId: newShift.jobId,
            },
          },
        };
      })
    );

    await syncWithBackend();
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="app-container">
      <MetricBar
        user={currentUser}
        filterText={filterText}
        onFilterChange={setFilterText}
        selectedDepartment={selectedDepartment}
        departments={departments}
        onDepartmentChange={setSelectedDepartment}
        employeeCount={filteredEmployees.length}
        ownEmployee={ownEmployeeRecord}
        employeeViewScope={employeeViewScope}
        onEmployeeViewScopeChange={setEmployeeViewScope}
        onConfirmAllOwnShifts={handleConfirmAllOwnShifts}
        requests={shiftRequests}
        onResolveRequest={handleResolveRequest}
        onOpenManager={handleOpenManager}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
        showRoleSwitcher={DEMO_MODE}
      />

      <ColorLegend />

      <main className="main-grid-wrapper">
        <VirtualizedGrid
          employees={filteredEmployees}
          days={days}
          currentUserCode={currentUser.code}
          onShiftClick={handleShiftClick}
        />
      </main>

      <ShiftDetailModal
        shift={selectedShift}
        employee={selectedEmployee}
        userRole={currentUser.role}
        currentUserCode={currentUser.code}
        onClose={() => {
          setSelectedShift(null);
          setSelectedEmployee(null);
        }}
        onSupervisorUpdateShift={handleSupervisorUpdateShift}
        onEmployeeAcknowledgeShift={handleEmployeeAcknowledgeShift}
        onEmployeeRequestChange={handleEmployeeRequestChange}
      />

      <BackendManagerModal
        isOpen={isManagerOpen}
        initialTab={managerTab}
        onClose={() => setIsManagerOpen(false)}
        onEmployeeCreated={handleEmployeeCreated}
        onShiftCreated={handleShiftCreated}
        employees={employees}
        backendOnline={backendOnline}
      />
    </div>
  );
}