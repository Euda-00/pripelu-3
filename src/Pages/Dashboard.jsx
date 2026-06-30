import React, { useState, useEffect } from 'react';
import { Package, ClipboardList, ArrowLeft, AlertTriangle, BarChart3 } from 'lucide-react'; // <-- Agregué BarChart3
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [citas, setCitas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);

useEffect(() => {
    const obtenerDatosGlobales = async () => {
      
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      // 1. Cargamos las Citas
      try {
        const resCitas = await fetch(`${baseUrl}/api/citas`);
        if (resCitas.ok) {
          const citasBackend = await resCitas.json();
          setCitas(citasBackend);
        }
      } catch (error) {
        console.error("Falla de conexión al pedir citas:", error);
      }

      // 2. Cargamos el Inventario
      try {
        const resInventario = await fetch(`${baseUrl}/api/inventarios`);
        if (resInventario.ok) {
          const inventarioBackend = await resInventario.json();
          setInventario(inventarioBackend);
        }
      } catch (error) {
        console.error("Falla de conexión al pedir inventario:", error);
      }

      setCargando(false);
    };

    obtenerDatosGlobales();
  }, []);

  return (
    <div className="min-h-screen bg-[#fdf2f8] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header con retorno */}
        <div className="flex justify-between items-center mb-8">
          <Link to="/" className="text-[#f171ab] flex items-center gap-2 font-bold hover:drop-shadow-sm">
            <ArrowLeft size={20} /> Volver al Inicio
          </Link>
          <h1 className="text-2xl font-serif text-[#b02a6b] italic font-bold">Panel de Administración</h1>
        </div>

        {/* Resumen de Tarjetas (AHORA CON 3 COLUMNAS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-pink-100 flex items-center gap-5 hover:scale-[1.02] transition-transform">
            <div className="bg-orange-100 p-4 rounded-2xl text-orange-500">
              <Package size={30} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-black">Productos Bodega</p>
              {cargando ? (
                <p className="text-sm font-bold text-orange-400">Cargando...</p>
              ) : (
                <p className="text-2xl font-bold text-gray-700">{inventario.length}</p>
              )}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-pink-100 flex items-center gap-5 hover:scale-[1.02] transition-transform">
            <div className="bg-pink-100 p-4 rounded-2xl text-[#f171ab]">
              <ClipboardList size={30} />
            </div>
            <div className="flex-grow">
              <p className="text-xs text-gray-400 uppercase font-black">Total Reservas</p>
              {cargando ? (
                <p className="text-sm font-bold text-[#f171ab]">Cargando...</p>
              ) : (
                <p className="text-2xl font-bold text-gray-700">{citas.length}</p>
              )}
            </div>
            <Link 
                to="/admin/citas" 
                className="bg-[#f171ab] text-white text-xs font-bold px-4 py-3 rounded-xl hover:bg-[#b02a6b] transition-colors shadow-lg shadow-pink-100 whitespace-nowrap"
            >
                Ver citas →
            </Link>
          </div>

          {/* NUEVA TARJETA DE REPORTES FINANCIEROS */}
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-pink-100 flex items-center gap-5 hover:scale-[1.02] transition-transform">
            <div className="bg-green-100 p-4 rounded-2xl text-green-500">
              <BarChart3 size={30} />
            </div>
            <div className="flex-grow">
              <p className="text-xs text-gray-400 uppercase font-black">Finanzas</p>
              <p className="text-xl font-bold text-gray-700">Reportes</p>
            </div>
            <Link 
                to="/admin/reportes" 
                className="bg-green-500 text-white text-xs font-bold px-4 py-3 rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-100 whitespace-nowrap"
            >
                Ver flujos →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-pink-100 flex items-center gap-5 hover:scale-[1.02] transition-transform">
            <div className="bg-green-100 p-4 rounded-2xl text-green-500">
              <BarChart3 size={30} />
            </div>
            <div className="flex-grow">
              <p className="text-xs text-gray-400 uppercase font-black">Finanzas</p>
              <p className="text-xl font-bold text-gray-700">Gestión de Empleados</p>
            </div>
            <Link 
                to="/admin/empleados" 
                className="bg-green-500 text-white text-xs font-bold px-4 py-3 rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-100 whitespace-nowrap"
            >
                Ver flujos →
            </Link>
          </div>
       

        </div>

        {/* TABLA DE INVENTARIO (Queda igual a como la tenías) */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-pink-50">
          <div className="bg-[#f171ab] p-6">
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <Package size={20} /> Control de Inventario Físico
            </h2>
          </div>
          
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[#b02a6b] text-sm uppercase tracking-widest border-b border-pink-50">
                  <th className="p-4 font-bold">ID</th>
                  <th className="p-4 font-bold">Insumo</th>
                  <th className="p-4 font-bold text-center">Stock Actual</th>
                  <th className="p-4 font-bold text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {cargando ? (
                   <tr>
                     <td colSpan="4" className="p-10 text-center text-[#f171ab] font-bold">Conectando con la bodega...</td>
                   </tr>
                ) : inventario.length > 0 ? inventario.map((item) => (
                  <tr key={item.id_insumo || item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-400">#{item.id_insumo || item.id}</td>
                    <td className="p-4 font-bold text-gray-800">{item.nombre}</td>
                    <td className="p-4 text-center">
                      <span className="text-xl font-black text-gray-700">{item.stock_actual || item.stockActual}</span>
                    </td>
                    <td className="p-4 text-center flex justify-center">
                      {(item.stock_actual || item.stockActual) <= 10 ? (
                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <AlertTriangle size={14} /> Stock Crítico
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold">
                          Óptimo
                        </span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-gray-400 italic">
                      No hay insumos registrados en la base de datos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
}