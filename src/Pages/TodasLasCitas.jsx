import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, Scissors, CheckCircle, XCircle, DollarSign, Package, Loader2, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TodasLasCitas() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados para el manejo de la ventana modal de pago transaccional
  const [modalAbierto, setModalAbierto] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [insumosAGastar, setInsumosAGastar] = useState([]);
  const [pasoPago, setPasoPago] = useState('resumen'); 

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  useEffect(() => {
    const fetchCitas = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/citas`);
        if (res.ok) {
          const data = await res.json();
          setCitas(data);
        }
      } catch (err) {
        console.error("Error cargando citas globales:", err);
      } finally {
        setCargando(false);
      }
    };
    fetchCitas();
  }, []);

  const handleBorrarTodoDebug = async () => {
    const confirmacion = window.confirm("⚠️ ALERTA: ¿Estás seguro que quieres BORRAR TODAS las citas de la base de datos?");
    if (!confirmacion) return;

    try {
      if (citas.length === 0) return alert("La base de datos ya está vacía.");
      for (const cita of citas) {
        const idCita = cita.id || cita.id_cita;
        await fetch(`${baseUrl}/api/citas/${idCita}`, { method: 'DELETE' });
      }
      alert("¡Base de datos limpia exitosamente! 🚀");
      window.location.reload(); 
    } catch (error) {
      console.error("Error al borrar las citas:", error);
    }
  };

  const abrirModalCobro = async (cita) => {
    setCitaSeleccionada(cita);
    setPasoPago('resumen'); 
    setModalAbierto(true);
    setInsumosAGastar([]); 

    let insumosDeLaCita = cita.detalles?.[0]?.servicio?.insumosRequeridos;
    const idServicio = cita.detalles?.[0]?.servicio?.id || cita.detalles?.[0]?.servicio?.id_servicio;

    if (!insumosDeLaCita && idServicio) {
      try {
        const resServicios = await fetch(`${baseUrl}/api/servicios`);
        const catalogo = await resServicios.json();
        const servicioReal = catalogo.find(s => parseInt(s.id || s.id_servicio) === parseInt(idServicio));
        insumosDeLaCita = servicioReal?.insumosRequeridos || [];
      } catch (e) {
        console.error("No se pudo cargar el catálogo de servicios", e);
      }
    }

    if (insumosDeLaCita && insumosDeLaCita.length > 0) {
      const gastosMapeados = insumosDeLaCita.map(item => ({
        idInsumoReal: item.inventario?.id || item.inventario?.id_insumo,
        nombreProducto: item.inventario?.nombre || 'Producto de Bodega',
        amount: item.cantidad
      }));
      setInsumosAGastar(gastosMapeados);
    }
  };

  const iniciarPagoSimulado = () => {
    setPasoPago('procesando'); 
    setTimeout(() => {
      confirmarCobroYFinalizar();
    }, 2500);
  };

  const confirmarCobroYFinalizar = async () => {
    if (!citaSeleccionada) return;
    const idCita = citaSeleccionada.id || citaSeleccionada.id_cita;

    try {
      // Deducción del stock en inventario físico
      for (const item of insumosAGastar) {
        const idInsumo = item.idInsumoReal;
        const cantidadRestar = item.amount;

        if (idInsumo) {
          const resStock = await fetch(`${baseUrl}/api/inventarios/${idInsumo}`);
          if (resStock.ok) {
            const productoActual = await resStock.json();
            const stockViejo = productoActual.stockActual || productoActual.stock_actual;
            const stockNuevo = Math.max(0, stockViejo - cantidadRestar);

            await fetch(`${baseUrl}/api/inventarios/${idInsumo}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...productoActual, 
                stockActual: stockNuevo,
                stock_actual: stockNuevo 
              })
            });
          }
        }
      }

      // Modificación de la entidad cita a estado consolidado
      const idUsuario = citaSeleccionada.usuario?.id || citaSeleccionada.usuario?.id_usuario;
      const idEmpleado = citaSeleccionada.empleado?.id || citaSeleccionada.empleado?.id_empleado;

      const paqueteLimpio = {
        fechaHora: citaSeleccionada.fechaHora,
        estado: 'Finalizado',
        usuario: idUsuario ? { id: parseInt(idUsuario) } : null,
        empleado: idEmpleado ? { id: parseInt(idEmpleado) } : null
      };

      const respuestaCita = await fetch(`${baseUrl}/api/citas/${idCita}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paqueteLimpio)
      });

      if (respuestaCita.ok) {
        setCitas(citas.map(c => (c.id === idCita || c.id_cita === idCita) ? { ...c, estado: 'Finalizado' } : c));
        setPasoPago('exito');

        setTimeout(() => {
          setModalAbierto(false);
          setCitaSeleccionada(null);
        }, 2000);
      } else {
        alert("Hubo un error al actualizar el estado de la cita.");
        setPasoPago('resumen');
      }
    } catch (error) {
      console.error("Error en el proceso final:", error);
      alert("Error de conexión durante el pago y descuento.");
      setPasoPago('resumen');
    }
  };

  const cancelarCita = async (id) => {
    const citaActual = citas.find(c => c.id === id || c.id_cita === id);
    if (!citaActual) return;
    
    const idUsuario = citaActual.usuario?.id || citaActual.usuario?.id_usuario;
    const idEmpleado = citaActual.empleado?.id || citaActual.empleado?.id_empleado;

    try {
      const respuesta = await fetch(`${baseUrl}/api/citas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fechaHora: citaActual.fechaHora,
          estado: 'Cancelado',
          usuario: idUsuario ? { id: parseInt(idUsuario) } : null,
          empleado: idEmpleado ? { id: parseInt(idEmpleado) } : null
        })
      });

      if (respuesta.ok) {
        setCitas(citas.map(c => (c.id === id || c.id_cita === id) ? { ...c, estado: 'Cancelado' } : c));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const obtenerEstiloEstado = (estado) => {
    const est = estado?.toLowerCase().trim() || '';
    if (est === 'pendiente' || est.includes('confirmad')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (est === 'finalizado') return 'bg-green-100 text-green-700 border-green-200';
    if (est === 'cancelado') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // ==========================================
  // Lógica de segmentación cronológica (Filtro Diario)
  // ==========================================
  const hoy = new Date();
  
  const citasDeHoy = citas.filter(cita => {
    const fechaCita = new Date(cita.fechaHora);
    return (
      fechaCita.getDate() === hoy.getDate() &&
      fechaCita.getMonth() === hoy.getMonth() &&
      fechaCita.getFullYear() === hoy.getFullYear()
    );
  });

  const otrasCitas = citas.filter(cita => {
    const fechaCita = new Date(cita.fechaHora);
    return (
      fechaCita.getDate() !== hoy.getDate() ||
      fechaCita.getMonth() !== hoy.getMonth() ||
      fechaCita.getFullYear() !== hoy.getFullYear()
    );
  });

  // Renderizador de tarjetas de citas individuales
  const renderCitaCard = (cita) => {
    const estadoLimpio = cita.estado?.trim().toLowerCase() || '';
    const idActual = cita.id || cita.id_cita;
    const mostrarBotones = estadoLimpio === 'pendiente' || estadoLimpio.includes('confirmad');

    return (
      <div key={idActual} className="relative bg-white rounded-[2rem] shadow-xl border border-pink-50 overflow-hidden hover:scale-[1.02] transition-transform flex flex-col">
        {estadoLimpio === 'finalizado' && (
          <span className="absolute -top-1 -right-8 bg-green-500 text-white text-[10px] font-black px-10 py-1 shadow-md transform rotate-45 z-10">
            PAGADA
          </span>
        )}

        <div className={`px-6 py-2 text-center text-xs font-black uppercase tracking-widest border-b ${obtenerEstiloEstado(cita.estado)}`}>
          {cita.estado || 'Sin Estado'}
        </div>

        <div className="p-6 space-y-4 flex-grow">
          <div className="flex items-center gap-3 text-gray-500">
            <Calendar size={18} className="text-[#f171ab]" />
            <span className="text-sm font-bold">
              {new Date(cita.fechaHora).toLocaleDateString('es-CL')} - {new Date(cita.fechaHora).toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'})}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-pink-50 p-2 rounded-full text-[#f171ab]"><User size={18} /></div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Cliente</p>
              <p className="font-bold text-gray-800">
                {cita.usuario && cita.usuario.nombre 
                  ? `${cita.usuario.nombre} ${cita.usuario.apellido || ''}`
                  : 'Cliente Sin Nombre'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-full text-blue-500"><Scissors size={18} /></div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Estilista Asignado</p>
              <p className="font-bold text-gray-700">{cita.empleado?.nombre || 'No asignado'}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-dashed border-pink-100 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Servicio</p>
              <p className="text-[#b02a6b] font-bold italic">{cita.detalles?.[0]?.servicio?.nombre || 'Varios'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase font-bold">Valor</p>
              <p className="text-2xl font-black text-gray-800">${cita.valorTotal?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {mostrarBotones ? (
          <div className="flex border-t border-gray-100">
            <button 
              onClick={() => cancelarCita(idActual)}
              className="flex-1 flex justify-center items-center gap-2 py-4 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              <XCircle size={18} /> Cancelar
            </button>
            <div className="w-[1px] bg-gray-100"></div>
            <button 
              onClick={() => abrirModalCobro(cita)}
              className="flex-1 flex justify-center items-center gap-2 py-4 text-sm font-bold text-[#f171ab] hover:bg-pink-50 transition-colors"
            >
              <CreditCard size={18} /> Ir a Caja
            </button>
          </div>
        ) : estadoLimpio === 'finalizado' ? (
          <div className="bg-green-50 py-3 text-center text-green-600 font-bold text-sm border-t border-green-100">
            ✅ Operación Finalizada en Caja
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fdf2f8] p-4 md:p-8 relative">
      
      {/* ================= MODAL DE PAGO INTELIGENTE ================= */}
      {modalAbierto && citaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-pink-100 animate-in zoom-in duration-200">
            
            <div className={`${pasoPago === 'exito' ? 'bg-green-500' : 'bg-[#f171ab]'} p-6 text-white text-center relative transition-colors duration-500`}>
              {pasoPago === 'resumen' && (
                <button onClick={() => setModalAbierto(false)} className="absolute top-6 right-6 font-bold hover:scale-110 transition-transform text-xl">✕</button>
              )}
              <h2 className="text-2xl font-serif italic font-bold">
                {pasoPago === 'resumen' ? 'Proceso de Cobro' : pasoPago === 'procesando' ? 'Terminal de Pago' : 'Transacción Exitosa'}
              </h2>
            </div>

            <div className="p-8">
              {pasoPago === 'resumen' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="bg-pink-50 p-5 rounded-2xl border border-pink-100">
                    <div className="flex justify-between items-center mb-2 text-gray-600">
                      <span>Valor Total del Servicio:</span>
                      <span className="font-bold">${citaSeleccionada.valorTotal?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4 text-green-600 border-b border-pink-100 pb-4">
                      <span>Abono Web (Ya pagado):</span>
                      <span className="font-bold">- ${(citaSeleccionada.valorTotal * 0.20).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[#b02a6b] text-xl font-black">
                      <span>Total a Pagar en Local:</span>
                      <span>${(citaSeleccionada.valorTotal * 0.80).toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[#b02a6b] font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Package size={16}/> Bodega: Stock a rebajar
                    </h3>
                    {insumosAGastar.length > 0 ? (
                      <ul className="space-y-2">
                        {insumosAGastar.map((insumo, idx) => (
                          <li key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="text-gray-700 font-medium">{insumo.nombreProducto}</span>
                            <span className="text-red-500 font-bold bg-red-50 px-2 py-1 rounded-md border border-red-100">- {insumo.amount} unid.</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">Este servicio no requiere descontar insumos.</p>
                    )}
                  </div>

                  <button 
                    onClick={iniciarPagoSimulado}
                    className="w-full bg-[#f171ab] hover:bg-[#d85a94] text-white py-4 rounded-full font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    <CreditCard size={20}/> Procesar Pago y Finalizar
                  </button>
                </div>
              )}

              {pasoPago === 'procesando' && (
                <div className="py-12 flex flex-col items-center justify-center space-y-6 animate-in fade-in">
                  <Loader2 size={64} className="text-[#f171ab] animate-spin" />
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800">Conectando con el Banco...</h3>
                    <p className="text-gray-500 text-sm mt-2">Por favor, siga las instrucciones en el terminal (POS).</p>
                  </div>
                </div>
              )}

              {pasoPago === 'exito' && (
                <div className="py-12 flex flex-col items-center justify-center space-y-6 animate-in zoom-in">
                  <div className="bg-green-100 p-6 rounded-full text-green-500">
                    <CheckCircle size={64} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-black text-green-600">¡Pago Aprobado!</h3>
                    <p className="text-gray-500 font-medium mt-2">La cita ha sido finalizada y el inventario rebajado.</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
      {/* ========================================================= */}

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-2 text-[#f171ab] font-bold hover:underline">
              <ArrowLeft size={20} /> Volver
            </Link>
            <h1 className="text-3xl font-serif text-[#b02a6b] italic font-bold">Caja y Reservas</h1>
          </div>
          
          <button 
            onClick={handleBorrarTodoDebug} 
            className="bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-lg border-2 border-red-900 transition-colors"
          >
            🗑️ DEBUG: Borrar TODAS las citas
          </button>
        </div>

        {cargando ? (
          <p className="text-center text-pink-500 font-bold py-20">Conectando con el servidor...</p>
        ) : citas.length === 0 ? (
           <p className="text-center text-gray-400 font-bold py-20">No hay citas registradas en el sistema.</p>
        ) : (
          <div className="space-y-12">
            
            {/* SECCIÓN 1: CITAS PROGRAMADAS PARA HOY */}
            <div>
              <h2 className="text-xl font-bold text-[#b02a6b] uppercase tracking-wider mb-6 flex items-center gap-2">
                📅 Citas para Hoy ({citasDeHoy.length})
              </h2>
              {citasDeHoy.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-8 text-center text-gray-400 font-medium border border-pink-100/50 shadow-sm">
                  No hay citas agendadas para el día de hoy.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {citasDeHoy.map(renderCitaCard)}
                </div>
              )}
            </div>

            {/* SECCIÓN 2: RESTO DEL HISTORIAL / OTRAS FECHAS */}
            <div>
              <h2 className="text-xl font-bold text-gray-500 uppercase tracking-wider mb-6">
                📚 Otras Reservas ({otrasCitas.length})
              </h2>
              {otrasCitas.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-8 text-center text-gray-400 font-medium border border-pink-100/50 shadow-sm">
                  No hay más registros en el historial.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otrasCitas.map(renderCitaCard)}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}