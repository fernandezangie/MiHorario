export type ShiftType = 'ORDINARY' | 'SURCHARGE' | 'OVERTIME' | 'REST';
export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface AuthUser {
  id: string;
  code: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  department: string;
  token?: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  day: number;
  dateStr: string;
  startTime: string;
  endTime: string;
  type: ShiftType;
  hours: number;
  label: string;
  location: string;
  acknowledged?: boolean;
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  email?: string;
  role: string;
  department: string;
  avatarColor: string;
  shifts: Record<number, Shift>;
}

export interface ShiftChangeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  day: number;
  dateStr: string;
  currentSchedule: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export type ManagerTab = 'shift' | 'employee' | 'zone' | 'catalog';
