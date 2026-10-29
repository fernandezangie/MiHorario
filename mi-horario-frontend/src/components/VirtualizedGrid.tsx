import React, { useState, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Employee, Shift } from '../types/schedule';

interface VirtualizedGridProps {
  employees: Employee[];
  days: number[];
  currentUserCode?: string;
  onShiftClick: (shift: Shift, employee: Employee) => void;
}

const ROW_HEIGHT = 72;
const OVERSCAN = 5;
const CONTAINER_HEIGHT = 540;
const WEEKDAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

export const VirtualizedGrid: React.FC<VirtualizedGridProps> = ({
  employees,
  days,
  currentUserCode,
  onShiftClick,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    employees.length,
    Math.ceil((scrollTop + CONTAINER_HEIGHT) / ROW_HEIGHT) + OVERSCAN
  );

  const visibleEmployees = employees.slice(startIndex, endIndex);
  const topSpacerHeight = startIndex * ROW_HEIGHT;
  const bottomSpacerHeight = Math.max(0, (employees.length - endIndex) * ROW_HEIGHT);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div className="virtualized-wrapper">
      <div
        ref={containerRef}
        className="grid-scroll-container virtualized-scroll-container"
        style={{ maxHeight: `${CONTAINER_HEIGHT}px` }}
        onScroll={handleScroll}
      >
        <table className="schedule-table">
          {/* Colgroup bloquea matemáticamente el ancho de cada columna entre THEAD y TBODY */}
          <colgroup>
            <col className="col-employee-fixed" />
            {days.map((day) => (
              <col key={day} className="col-day-fixed" />
            ))}
          </colgroup>

          <thead className="virtual-sticky-header">
            <tr>
              <th className="sticky-col header-employee">
                Colaborador ({employees.length})
              </th>
              {days.map((day) => {
                const weekday = WEEKDAYS[(day - 1) % 7];
                const isWeekend = weekday === 'DOM' || weekday === 'SÁB';
                return (
                  <th
                    key={day}
                    className={`header-day ${isWeekend ? 'header-day-weekend' : ''}`}
                  >
                    <div className="day-number">Día {day}</div>
                    <div className="day-weekday">{weekday}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {topSpacerHeight > 0 && (
              <tr style={{ height: `${topSpacerHeight}px` }} aria-hidden="true">
                <td
                  colSpan={days.length + 1}
                  style={{ padding: 0, border: 'none' }}
                />
              </tr>
            )}

            {visibleEmployees.map((emp) => {
              const isOwnRow = currentUserCode && emp.code === currentUserCode;
              return (
                <tr
                  key={emp.id}
                  className={`employee-row ${isOwnRow ? 'employee-row-own' : ''}`}
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  <td className="sticky-col cell-employee-info">
                    <div className="employee-cell-content">
                      <div
                        className="employee-avatar"
                        style={{ backgroundColor: emp.avatarColor }}
                      >
                        {emp.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="employee-details">
                        <div className="employee-name-line">
                          <span className="employee-name">{emp.name}</span>
                          {isOwnRow && <span className="own-row-badge">TÚ</span>}
                        </div>
                        <span className="employee-role">{emp.role}</span>
                        <span className="employee-dept">
                          {emp.code} • {emp.department}
                        </span>
                      </div>
                    </div>
                  </td>

                  {days.map((day) => {
                    const shift = emp.shifts[day];
                    const weekday = WEEKDAYS[(day - 1) % 7];
                    const isWeekend = weekday === 'DOM' || weekday === 'SÁB';

                    if (!shift) {
                      return (
                        <td
                          key={day}
                          className={`shift-cell cell-empty ${isWeekend ? 'shift-cell-weekend' : ''}`}
                        >
                          -
                        </td>
                      );
                    }

                    let badgeClass = 'shift-ordinary';
                    if (shift.type === 'SURCHARGE') badgeClass = 'shift-surcharge';
                    else if (shift.type === 'OVERTIME') badgeClass = 'shift-overtime';
                    else if (shift.type === 'REST') badgeClass = 'shift-rest';

                    return (
                      <td
                        key={day}
                        className={`shift-cell ${isWeekend ? 'shift-cell-weekend' : ''}`}
                        onClick={() => onShiftClick(shift, emp)}
                        title={`Día ${day} (${weekday}) • ${emp.name}: ${shift.type === 'REST'
                            ? 'Descanso'
                            : `${shift.startTime} a ${shift.endTime} (${shift.hours}h)`
                          }`}
                      >
                        <div className={`shift-pill ${badgeClass}`}>
                          <div className="shift-time-row">
                            <span className="shift-time">
                              {shift.type === 'REST' ? 'LIBRE' : shift.startTime}
                            </span>
                            {shift.acknowledged && (
                              <CheckCircle2
                                size={11}
                                className="shift-ack-icon"
                              />
                            )}
                          </div>
                          <div className="shift-hours">
                            {shift.type === 'REST' ? 'Descanso' : `${shift.hours}h`}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {bottomSpacerHeight > 0 && (
              <tr style={{ height: `${bottomSpacerHeight}px` }} aria-hidden="true">
                <td
                  colSpan={days.length + 1}
                  style={{ padding: 0, border: 'none' }}
                />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
