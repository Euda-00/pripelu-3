import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Inventario() {
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchInventario = async () => {
      try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

      const res = await fetch(`${baseUrl}/api/inventarios`);
        if (res.ok) {
          const data = await res.json();
          setInsumos(data);
        }
      } catch (err) {
        console.error("Error cargando inventario:", err);
      } finally {
        setCargando(false);
      }
    };
    fetchInventario();
  }, []);

  return (
    <div className="min-h-screen bg-[#fdf2f8] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/admin" className="flex items-center gap-2 text-[#f171ab] font-bold hover:underline">
            <ArrowLeft size={20} /> Volver al Panel
          </Link>
          <h1 className="text-3xl font-serif text-[#b02a6b] italic font-bold flex items-center gap-3">
            <Package /> Control de Bodega
          </h1>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl border border-pink-50 overflow-hidden">
          {cargando ? (
            <p className="text-center text-[#f171ab] font-bold py-10">Revisando la bodega...</p>
          ) : insumos.length === 0 ? (
            <p className="text-center text-gray-500 font-bold py-10">No hay insumos registrados en la base de datos.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-pink-50 text-[#b02a6b] text-sm uppercase tracking-widest border-b border-pink-100">
                  <th className="p-5 font-bold">ID</th>
                  <th className="p-5 font-bold">Insumo</th>
                  <th className="p-5 font-bold text-center">Stock Actual</th>
                  <th className="p-5 font-bold text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {insumos.map((item) => (
                  <tr key={item.id_insumo || item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-5 font-bold text-gray-400">#{item.id_insumo || item.id}</td>
                    <td className="p-5 font-bold text-gray-800">{item.nombre}</td>
                    <td className="p-5 text-center">
                      <span className="text-xl font-black text-gray-700">{item.stock_actual || item.stockActual}</span>
                    </td>
                    <td className="p-5 text-center flex justify-center">
                      {/* Lógica de Alerta de Stock Bajo */}
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
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}