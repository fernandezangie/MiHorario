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

const TOTAL_EMPLOYEES = 50;
const TOTAL_DAYS = 30;

export function App() {
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

  // Solicitudes de cambio de turno entre el Perfil Empleado y el Perfil Supervisor
  const [shiftRequests, setShiftRequests] = useState<ShiftChangeRequest[]>([
    {
      id: 'REQ-INIT-1',
      employeeId: 'EMP-1001',
      employeeName: 'Carlos Rodríguez',
      employeeCode: 'COM-2000',
      day: 4,
      dateStr: '2026-10-04',
      currentSchedule: '06:00 - 14:00',
      reason: 'Cita médica programada: Control odontológico a las 09:00 AM',
      status: 'PENDING',
      createdAt: 'Hace 15 min',
    },
  ]);

  const syncWithBackend = useCallback(async () => {
    const isUp = await api.checkBackendHealth();
    setBackendOnline(isUp);

    if (isUp) {
      try {
        const dbEmployees = await api.getEmployees();
        if (Array.isArray(dbEmployees) && dbEmployees.length > 0) {
          setEmployees((prev) => {
            const existingCodes = new Set(prev.map((e) => e.code));
            const mappedNew: Employee[] = dbEmployees
              .filter((dbEmp: any) => {
                const code = dbEmp.code?.value ?? dbEmp.code;
                return code && !existingCodes.has(code);
              })
              .map((dbEmp: any, idx: number) => {
                const id = dbEmp.id?.value ?? dbEmp.id ?? `EMP-DB-${idx}`;
                const code = dbEmp.code?.value ?? dbEmp.code ?? `COM-DB-${idx}`;
                const name = dbEmp.name?.value ?? dbEmp.name ?? 'Colaborador Comfama';
                return {
                  id,
                  code,
                  name,
                  role: 'Operador Parque',
                  department: 'Operaciones Parque',
                  avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                  shifts: generateShiftsForEmployee(id, idx + 50, TOTAL_DAYS),
                };
              });
            return [...mappedNew, ...prev];
          });
        }
      } catch {
        // Conserva la programación en memoria si la base de datos no tiene registros iniciales
      }
    }
  }, []);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

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
    return (
      employees.find(
        (e) =>
          e.code === currentUser.code ||
          e.name.toLowerCase() === currentUser.name.toLowerCase()
      ) ?? employees[0]
    );
  }, [employees, currentUser]);

  const filteredEmployees = useMemo(() => {
    if (!currentUser) return [];

    // PERSPECTIVA EMPLEADO
    if (currentUser.role === 'EMPLOYEE') {
      if (employeeViewScope === 'OWN') {
        return ownEmployeeRecord ? [ownEmployeeRecord] : employees.slice(0, 1);
      }
      // Si elige ver compañeros de su área, pone su propia fila de primera
      const targetDept = ownEmployeeRecord?.department ?? currentUser.department;
      const areaPeers = employees.filter((e) => e.department === targetDept);
      if (!ownEmployeeRecord) return areaPeers;
      return [
        ownEmployeeRecord,
        ...areaPeers.filter((e) => e.id !== ownEmployeeRecord.id),
      ];
    }

    // PERSPECTIVA SUPERVISOR
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

  const handleSupervisorUpdateShift = (updated: {
    employeeId: string;
    day: number;
    startTime: string;
    endTime: string;
    location: string;
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
  };

  const handleEmployeeAcknowledgeShift = (employeeId: string, day: number) => {
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
  };

  const handleConfirmAllOwnShifts = () => {
    if (!ownEmployeeRecord) return;
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
    setShiftRequests((prev) => [newReq, ...prev]);
  };

  const handleResolveRequest = (
    reqId: string,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    const targetReq = shiftRequests.find((r) => r.id === reqId);
    setShiftRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status } : r))
    );

    if (status === 'APPROVED' && targetReq) {
      handleSupervisorUpdateShift({
        employeeId: targetReq.employeeId,
        day: targetReq.day,
        startTime: '-',
        endTime: '-',
        location: 'No aplica',
        isRest: true,
      });
    }
  };

  const handleEmployeeCreated = (newEmp: {
    code: string;
    name: string;
    email: string;
    role: string;
    department: string;
  }) => {
    const id = `EMP-${Date.now().toString().slice(-4)}`;
    const created: Employee = {
      id,
      code: newEmp.code,
      name: newEmp.name,
      email: newEmp.email,
      role: newEmp.role,
      department: newEmp.department,
      avatarColor: '#ED217A',
      shifts: generateShiftsForEmployee(id, employees.length + 1, TOTAL_DAYS),
    };
    setEmployees((prev) => [created, ...prev]);
  };

  const handleShiftCreated = (newShift: {
    employeeId: string;
    day: number;
    startTime: string;
    endTime: string;
    location: string;
  }) => {
    const startH = parseInt(newShift.startTime.split(':')[0], 10) || 8;
    const endH = parseInt(newShift.endTime.split(':')[0], 10) || 16;
    const hours = endH >= startH ? endH - startH : 24 - startH + endH;
    let type: ShiftType = 'ORDINARY';
    if (hours > 10) type = 'OVERTIME';
    else if (startH >= 18 || endH <= 6) type = 'SURCHARGE';

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
              dateStr: `2026-10-${newShift.day.toString().padStart(2, '0')}`,
              startTime: newShift.startTime,
              endTime: newShift.endTime,
              type,
              hours,
              label: `Turno Asignado (${hours}h)`,
              location: newShift.location,
            },
          },
        };
      })
    );
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
        onLogout={() => setCurrentUser(null)}
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
