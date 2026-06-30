import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, Calendar, ShieldAlert, Percent, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom'; // <-- AÑADIDO: Importación para poder navegar

export default function AdminReports() {
  const [citas, setCitas] = useState([]);
  const [pagos, setPagos] = useState([]); 
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const userRole = localStorage.getItem('userRole') || 'cliente';

  useEffect(() => {
    if (userRole !== 'admin') {
      setCargando(false);
      return;
    }

    const obtenerDatosGlobales = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

        const [resCitas, resPagos] = await Promise.all([
          fetch(`${baseUrl}/api/citas`),
          fetch(`${baseUrl}/api/pagos`)
        ]);

        if (resCitas.ok) {
          const datosCitas = await resCitas.json();
          setCitas(datosCitas);
        }
        
        if (resPagos.ok) {
          const datosPagos = await resPagos.json();
          setPagos(datosPagos);
        } else {
          console.warn("No se pudo conectar a /api/pagos, se usará cálculo estimado.");
        }

      } catch (err) {
        console.error("Error cargando reportes financieros:", err);
        setError('Error de red al conectar con el servidor.');
      } finally {
        setCargando(false);
      }
    };

    obtenerDatosGlobales();
  }, [userRole]);

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-md border border-red-200 flex flex-col items-center gap-4">
          <ShieldAlert size={64} className="text-red-500" />
          <h2 className="text-2xl font-bold text-red-700">Acceso Restringido</h2>
          <p className="text-gray-500 text-sm mb-4">Este panel es exclusivo para administradores.</p>
          {/* <-- AÑADIDO: Botón para salvar a los curiosos atrapados aquí */}
          <Link to="/" className="bg-red-100 text-red-700 px-6 py-2 rounded-xl font-bold hover:bg-red-200 transition-colors">
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }
  
  // BALANCES REALES BASADOS EN BASE DE DATOS

  // 1. Citas válidas
  const citasValidas = citas.filter(c => c.estado?.toLowerCase() !== 'cancelado');
  const totalCitas = citasValidas.length;

  // 2. Dinero Recaudado en local (Citas finalizadas)
  const dineroTotalRecaudado = citas
    .filter(c => c.estado?.toLowerCase() === 'finalizado')
    .reduce((acc, c) => acc + (c.valorTotal || 0), 0);

  // 3. Abonos reales registrados en la tabla pagos
  const dineroAbonosReales = pagos
    .filter(p => p.tipoPago?.toLowerCase() === 'abono' || p.tipo_pago?.toLowerCase() === 'abono')
    .reduce((acc, p) => acc + (p.monto || p.valor || 0), 0);

  // 4. Caja total sumando lo recaudado en físico + los abonos Webpay
  const flujoTotalCaja = dineroTotalRecaudado + dineroAbonosReales;

  return (
    <div className="min-h-screen bg-[#fdf2f8] p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div>
          {/* <-- AÑADIDO: Botón para volver al Dashboard de Admin */}
          <Link to="/admin" className="text-[#f171ab] flex items-center gap-2 hover:underline font-bold mb-6 w-fit">
            <ArrowLeft size={20} /> Volver al Dashboard
          </Link>
          <h1 className="text-4xl font-serif text-[#b02a6b] italic font-bold">Panel de Reportes Financieros</h1>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-widest mt-1">Control de caja y pasarela de abonos</p>
        </div>

        {cargando ? (
          <p className="text-center text-[#f171ab] font-bold py-20 text-lg animate-pulse">Procesando balances...</p>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-2xl text-center font-bold">{error}</div>
        ) : (
          <>
            {/* TARJETAS KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Tarjeta 1: Dinero Físico Recaudado */}
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-[2rem] shadow-xl text-white flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Caja Recaudada (Citas Finalizadas)</p>
                  <h3 className="text-3xl font-black">${dineroTotalRecaudado.toLocaleString('es-CL')}</h3>
                  <p className="text-[11px] text-emerald-200">Pagos totales en el local</p>
                </div>
                <div className="bg-white/20 p-4 rounded-2xl"><DollarSign size={28} /></div>
              </div>

              {/* Tarjeta 2: LOS ABONOS REALES DE MYSQL */}
              <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-pink-100 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Recaudado por Abonos</p>
                  <h3 className="text-3xl font-black text-[#b02a6b]">${dineroAbonosReales.toLocaleString('es-CL')}</h3>
                  <p className="text-[11px] text-green-500 font-bold">✓ Cargado desde Tabla Pagos</p>
                </div>
                <div className="bg-pink-50 p-4 rounded-2xl text-[#f171ab]"><Percent size={28} /></div>
              </div>

              {/* Tarjeta 3: Volumen de Citas */}
              <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-pink-100 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Volumen de Citas Activas</p>
                  <h3 className="text-3xl font-black text-gray-800">{totalCitas}</h3>
                  <p className="text-[11px] text-gray-400">Excluye canceladas</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-gray-500"><Calendar size={28} /></div>
              </div>

            </div>

            {/* Balance General */}
            <div className="bg-pink-100/60 border border-pink-200 p-5 rounded-2xl text-center">
              <p className="text-xs text-[#b02a6b] font-bold uppercase tracking-wider">Caja Bruta Combinada (Citas + Abonos)</p>
              <h2 className="text-3xl font-black text-[#b02a6b]">${flujoTotalCaja.toLocaleString('es-CL')}</h2>
            </div>

            {/* TABLA PRINCIPAL */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-pink-100 overflow-hidden">
              <div className="px-8 py-6 bg-pink-50/20 border-b border-pink-50">
                <h3 className="font-serif text-xl font-bold text-[#b02a6b]">Libro de Operaciones Globales</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-400 text-[11px] uppercase tracking-widest font-bold border-b border-pink-50">
                      <th className="py-4 px-6 text-center">ID</th>
                      <th className="py-4 px-6">Cliente</th>
                      <th className="py-4 px-6">Estilista</th>
                      <th className="py-4 px-6">Servicio</th>
                      <th className="py-4 px-6 text-center">Estado Cita</th>
                      <th className="py-4 px-6 text-right">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
                    {citas.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-10 text-gray-400">No hay registros históricos.</td>
                      </tr>
                    ) : (
                      citas.map((cita) => {
                        const idCita = cita.id || cita.id_cita;
                        const nombreCliente = cita.usuario ? `${cita.usuario.nombre} ${cita.usuario.apellido || ''}` : 'Cliente Web';
                        const nombreEstilista = cita.empleado ? `${cita.empleado.nombre} ${cita.empleado.apellido || ''}` : 'No asignado';
                        const nombreServicio = cita.detalles && cita.detalles[0]?.servicio?.nombre || 'Servicio General';
                        const estado = cita.estado?.toLowerCase() || 'pendiente';

                        return (
                          <tr key={idCita} className="hover:bg-pink-50/10 transition-colors">
                            <td className="py-4 px-6 text-center font-mono font-bold text-gray-400">#{idCita}</td>
                            <td className="py-4 px-6 font-bold text-gray-800">{nombreCliente}</td>
                            <td className="py-4 px-6 text-gray-500">{nombreEstilista}</td>
                            <td className="py-4 px-6"><span className="bg-pink-50 text-[#b02a6b] px-2.5 py-1 rounded-xl text-xs">{nombreServicio}</span></td>
                            <td className="py-4 px-6 text-center">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                                estado === 'finalizado' ? 'bg-green-100 text-green-700 border border-green-200' :
                                estado === 'pendiente' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                {cita.estado}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-bold text-gray-800">
                              ${(cita.valorTotal || 0).toLocaleString('es-CL')}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}