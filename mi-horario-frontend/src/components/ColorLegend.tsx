import React from 'react';

export const ColorLegend: React.FC = () => {
  return (
    <div className="color-legend-container">
      <div className="legend-title">Convención de Turnos del Mes:</div>
      <div className="legend-items">
        <div className="legend-item">
          <span className="legend-dot dot-ordinary" />
          <span className="legend-text"><strong>Jornada Ordinaria</strong> (8h)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-surcharge" />
          <span className="legend-text"><strong>Recargo</strong> (Nocturno / Dominical)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-overtime" />
          <span className="legend-text"><strong>Horas Extra</strong> (&gt;10h)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-rest" />
          <span className="legend-text"><strong>Día de Descanso</strong> (Libre)</span>
        </div>
      </div>
      <div className="legend-hint">
        Haz clic sobre cualquier turno de la tabla para ver su detalle completo
      </div>
    </div>
  );
};
