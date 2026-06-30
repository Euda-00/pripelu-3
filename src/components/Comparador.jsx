import React, { useState, useRef } from 'react';

export const Comparador = ({ antes, despues }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef(null);

  // Lógica mejorada que unifica Mouse y Touch
  const handleMove = (event) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Obtenemos la X, ya sea del dedo (touches) o del mouse (clientX)
    const xClient = event.touches ? event.touches[0].clientX : event.clientX;
    const x = xClient - rect.left;
    const width = rect.width;
    
    let newPosition = (x / width) * 100;
    // Restringir entre 0 y 100
    newPosition = Math.max(0, Math.min(100, newPosition));
    setSliderPosition(newPosition);
  };

  return (
    <div 
      ref={containerRef} 
      className="comparador-container" /* Usamos la nueva clase CSS limpia */
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      /* Nota: handleMove directo funciona básico. Si quieres control total 
         MouseDown/Up, se puede agregar, pero esto ya es funcional */
    >
      {/* Imagen Despues (Fondo completo) */}
      <img src={despues} alt="Después" className="comparador-image" />

      {/* Imagen Antes (Recortada dinámicamente con clipPath) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden" 
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img src={antes} alt="Antes" className="comparador-image" />
      </div>

      {/* Linea divisoria y manilla */}
      <div 
        className="comparador-slider-line" 
        style={{ left: `calc(${sliderPosition}% - 2px)` }}
      >
        <div className="comparador-slider-handle">
          ↔
        </div>
      </div>
    </div>
  );
};