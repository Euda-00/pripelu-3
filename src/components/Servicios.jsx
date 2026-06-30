import React, { useState, useEffect } from 'react';

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerServicios = async () => {
      try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

      const res = await fetch(`${baseUrl}/api/servicios`);
        
        if (respuesta.ok) {
          const datos = await respuesta.json();
          setServicios(datos);
        } else {
          console.error('Error al traer los servicios');
        }
      } catch (error) {
        console.error('Falla en la conexión:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerServicios();
  }, []);

  return (
    <div className="bg-[#fdf2f8] min-h-screen">
      <div className="section-container max-w-6xl mx-auto">
        
        <div className="section-title-wrapper">
          <h2 className="section-title text-[#b02a6b]">Nuestro Catálogo</h2>
          <p className="section-subtitle !text-gray-500">Elige el servicio perfecto para ti</p>
        </div>

        {cargando ? (
          <p className="text-center text-[#f171ab] font-bold text-xl">Cargando la magia...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicios.map((servicio) => (
              <div key={servicio.id_servicio || servicio.id} className="card-pripelu flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#b02a6b] mb-2">{servicio.nombre}</h3>
                  <p className="text-gray-500 text-sm mb-4">{servicio.descripcion}</p>
                </div>
                
                <div className="border-t border-pink-50 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[#f171ab] font-bold text-lg">${servicio.precio}</span>
                    <span className="text-xs bg-pink-100 text-[#b02a6b] px-3 py-1 rounded-full font-bold">
                      {servicio.duracion_min || servicio.duracion} min
                    </span>
                  </div>
                  {/* Aquí usamos tu botón global */}
                  <button className="btn-nav w-full rounded-xl py-3">
                    Reservar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}