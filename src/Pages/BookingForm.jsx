import React, { useState, useEffect } from 'react';

export default function BookingForm({ onBookingComplete, onClose }) {
  const [servicios, setServicios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [citasExistentes, setCitasExistentes] = useState([]);
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  
  // Control de pasos (1: Formulario, 2: Pago, 3: Éxito)
  const [paso, setPaso] = useState(1);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [errorBackend, setErrorBackend] = useState('');

  const [formData, setFormData] = useState({
    servicioId: '',
    empleadoId: '',
    fecha: '',
    hora: '',
    notas: ''
  });

  const [datosPago, setDatosPago] = useState({
    numero: '',
    vencimiento: '',
    cvv: ''
  });

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // --- CALCULAR FECHA MÍNIMA (HOY) ---
  const fechaActual = new Date();
  const anio = fechaActual.getFullYear();
  const mes = String(fechaActual.getMonth() + 1).padStart(2, '0'); // +1 porque enero es 0
  const dia = String(fechaActual.getDate()).padStart(2, '0');
  const fechaMinima = `${anio}-${mes}-${dia}`;

  // 1. CARGAMOS LOS DATOS
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resServ, resEmp, resHorarios, resCitas] = await Promise.all([
          fetch(`${baseUrl}/api/servicios`),
          fetch(`${baseUrl}/api/empleado`),
          fetch(`${baseUrl}/api/horarios`),
          fetch(`${baseUrl}/api/citas`)
        ]);

        if (resServ.ok) setServicios(await resServ.json());
        if (resEmp.ok) setEmpleados(await resEmp.json());
        if (resHorarios.ok) setHorarios(await resHorarios.json());
        if (resCitas.ok) setCitasExistentes(await resCitas.json());
      } catch (error) {
        console.error("Error cargando opciones:", error);
      } finally {
        setCargandoDatos(false);
      }
    };
    cargarDatos();
  }, []);

  // 2. CÁLCULO DE HORAS
  useEffect(() => {
    if (!formData.empleadoId || !formData.fecha) {
      setHorasDisponibles([]);
      return;
    }

    const fechaObj = new Date(`${formData.fecha}T12:00:00`); 
    let diaJS = fechaObj.getDay(); 
    const diaJava = diaJS === 0 ? 7 : diaJS; 

    let horarioDia = null;

    if (horarios && horarios.length > 0) {
      for (let i = 0; i < horarios.length; i++) {
        const h = horarios[i];
        const idEmpBackend = h.empleado?.id || h.empleado?.id_empleado || h.id_empleado || h.empleadoId;
        const diaBackend = h.diaSemana || h.dia_semana || h.dia || h.dia_Semana;

        if (String(idEmpBackend) === String(formData.empleadoId) && String(diaBackend) === String(diaJava)) {
          horarioDia = h;
          break;
        }
      }
    }

    if (!horarioDia) {
      setHorasDisponibles([]);
      return;
    }

    const extraerHoraInt = (campo) => {
      if (campo == null) return null;
      if (typeof campo === 'object' && campo.hour !== undefined) return campo.hour;
      if (typeof campo === 'string') return parseInt(campo.split(':')[0]);
      if (Array.isArray(campo)) return campo[0];
      return null;
    };

    const inicio = extraerHoraInt(horarioDia.horaInicio) ?? extraerHoraInt(horarioDia.hora_inicio) ?? 10;
    const cierre = extraerHoraInt(horarioDia.horacierre) ?? extraerHoraInt(horarioDia.hora_cierre) ?? 19;
    const colacionInicio = extraerHoraInt(horarioDia.horaInicioAlmuerzo) ?? extraerHoraInt(horarioDia.hora_in_almuerzo) ?? 14;
    const colacionFin = extraerHoraInt(horarioDia.horaFinAlmuerzo) ?? extraerHoraInt(horarioDia.hora_fin_almuerzo) ?? 15;

    let slots = [];
    for (let i = inicio; i < cierre; i++) {
      if (i >= colacionInicio && i < colacionFin) continue; 
      const horaFormateada = `${i.toString().padStart(2, '0')}:00`;
      slots.push(horaFormateada);
    }

    const citasOcupadasDelDia = citasExistentes.filter(cita => {
      if (!cita.empleado || !cita.fechaHora || cita.estado?.toLowerCase() === 'cancelado') return false;
      const idEmp = cita.empleado.id || cita.empleado.id_empleado;
      const mismaFecha = cita.fechaHora.startsWith(formData.fecha);
      return parseInt(idEmp) === parseInt(formData.empleadoId) && mismaFecha;
    });

    const horasOcupadas = citasOcupadasDelDia.map(cita => {
      const horaCita = new Date(cita.fechaHora).getHours();
      return `${horaCita.toString().padStart(2, '0')}:00`;
    });

    const slotsFinales = slots.filter(slot => !horasOcupadas.includes(slot));
    setHorasDisponibles(slotsFinales);

  }, [formData.empleadoId, formData.fecha, horarios, citasExistentes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePagoChange = (e) => {
    const { name, value } = e.target;
    let valorFormateado = value;

    if (name === 'numero') {
      const soloNumeros = value.replace(/\D/g, '');
      const limite16 = soloNumeros.substring(0, 16);
      valorFormateado = limite16.replace(/(\d{4})(?=\d)/g, '$1 ');
      
    } else if (name === 'vencimiento') {
      const soloNumeros = value.replace(/\D/g, '');
      const limite4 = soloNumeros.substring(0, 4);
      if (limite4.length >= 3) {
        valorFormateado = `${limite4.substring(0, 2)}/${limite4.substring(2, 4)}`;
      } else {
        valorFormateado = limite4;
      }
      
    } else if (name === 'cvv') {
      valorFormateado = value.replace(/\D/g, '').substring(0, 3);
    }

    setDatosPago({ ...datosPago, [name]: valorFormateado });
  };

  // 3. CÁLCULOS MATEMÁTICOS PARA EL PAGO
  const servicioSeleccionado = servicios.find(s => parseInt(s.id) === parseInt(formData.servicioId) || parseInt(s.id_servicio) === parseInt(formData.servicioId));
  const precioFinal = servicioSeleccionado ? servicioSeleccionado.precio : 0;
  const duracionFinal = servicioSeleccionado ? (servicioSeleccionado.duracion_min || 45) : 45;
  
  const montoAbono = precioFinal * 0.20;
  const saldoPendiente = precioFinal - montoAbono;

  // PASO 1 al 2: Validamos y pasamos a la pantalla de pago
  const handleIrAPago = (e) => {
    e.preventDefault();
    if (!formData.servicioId || !formData.empleadoId || !formData.fecha || !formData.hora) {
      return alert("Por favor, completa todos los campos obligatorios ✨");
    }
    setPaso(2);
  };
  

  // --- PASO 2 al 3: EJECUTAR RESERVA Y PAGO AL BACKEND ---
  const handleEjecutarPago = async (e) => {
    e.preventDefault();
    setErrorBackend(''); 

    // ==========================================
    // 🛡️ 1. VALIDACIONES DE TARJETA
    // ==========================================
    const numeroLimpio = datosPago.numero.replace(/\s/g, ''); 
    if (numeroLimpio.length !== 16 || isNaN(numeroLimpio)) {
      setErrorBackend('El número de tarjeta debe tener exactamente 16 dígitos numéricos.');
      return; 
    }

    if (datosPago.cvv.length !== 3 || isNaN(datosPago.cvv)) {
      setErrorBackend('El código CVV debe tener exactamente 3 dígitos.');
      return;
    }

    const [mes, anio] = datosPago.vencimiento.split('/');
    if (!mes || !anio || mes < 1 || mes > 12 || anio.length !== 2) {
      setErrorBackend('Usa un formato válido para el vencimiento (MM/YY). Ej: 12/28');
      return;
    }

    const fechaActualValidation = new Date();
    const mesActual = fechaActualValidation.getMonth() + 1; 
    const anioActual = parseInt(fechaActualValidation.getFullYear().toString().slice(-2)); 
    const mesVencimiento = parseInt(mes);
    const anioVencimiento = parseInt(anio);

    if (anioVencimiento < anioActual || (anioVencimiento === anioActual && mesVencimiento < mesActual)) {
      setErrorBackend('La tarjeta ingresada se encuentra vencida. Usa otra tarjeta.');
      return;
    }

    // ==========================================
    // 🚀 2. TARJETA VÁLIDA: AHORA SÍ INICIAMOS EL PAGO
    // ==========================================
    setProcesandoPago(true);

    const userId = localStorage.getItem('userId') || 2;
    const idUsuarioLimpio = parseInt(userId); 
    const fechaHoraFormateada = `${formData.fecha}T${formData.hora}:00`;

    const nuevaReserva = {
      fechaHora: fechaHoraFormateada,
      estado: "Pendiente",
      notas: formData.notas || "Reserva con Abono Online",
      valorTotal: precioFinal,
      duracionTotal: duracionFinal,
      usuario: { id: idUsuarioLimpio }, 
      empleado: { id: parseInt(formData.empleadoId) }, 
      detalles: [{
          precioCita: precioFinal,
          servicio: { id: parseInt(formData.servicioId) }
      }]
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const respuestaCita = await fetch(`${baseUrl}/api/citas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaReserva)
      });

      if (!respuestaCita.ok) throw new Error("Fallo al crear la cita");

      const citaCreada = await respuestaCita.json();
      const idDeLaCitaNueva = citaCreada.id || citaCreada.id_cita;
      
      const nuevoPago = {
        cita: { id: idDeLaCitaNueva }, 
        monto: montoAbono,             
        fechaPago: new Date().toISOString(), 
        metodoPago: "Tarjeta",
        idTransaccionExacta: `TRX-${Math.floor(Math.random() * 1000000)}`, 
        estadoPago: "Aprobado",
        tipoPago: "Abono"              
      };

      const respuestaPago = await fetch(`${baseUrl}/api/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoPago)
      });

      if (!respuestaPago.ok) throw new Error("Fallo al registrar el pago");

      setPaso(3);
      setTimeout(() => {
        onBookingComplete(formData);
      }, 2500); 

    } catch (error) {
      console.error(error);
      setErrorBackend("Hubo un problema al procesar la reserva o el pago. Intenta de nuevo.");
      setProcesandoPago(false);
    }
  };

  return (
    <div className="relative bg-[#fff5f8] p-8 md:p-12 rounded-[3rem] shadow-2xl max-w-2xl w-full border border-pink-100 overflow-hidden min-h-[500px] flex flex-col justify-center">
      
      {paso !== 3 && !procesandoPago && (
        <button onClick={onClose} className="absolute top-6 right-6 text-[#b02a6b] hover:scale-110 transition-transform font-bold text-2xl z-10">✕</button>
      )}

      {/* --- PASO 1: FORMULARIO DE RESERVA --- */}
      {paso === 1 && (
        <>
          <div className="text-center mb-8">
            <p className="text-[#f171ab] text-xs font-bold uppercase tracking-[0.2em] mb-2">Reserva Online</p>
            <h2 className="text-4xl font-serif text-[#b02a6b] italic">Tu Nueva Imagen te Espera</h2>
          </div>

          {cargandoDatos ? (
            <p className="text-center text-[#f171ab] font-bold py-10">Conectando con el sistema...</p>
          ) : (
            <form onSubmit={handleIrAPago} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[#b02a6b] font-bold text-sm ml-2">Servicio</label>
                <select name="servicioId" value={formData.servicioId} onChange={handleChange} className="input-pripelu" required>
                  <option value="">Selecciona lo que buscas</option>
                  {servicios.map(s => (
                    <option key={s.id || s.id_servicio} value={s.id || s.id_servicio}>{s.nombre} - ${s.precio}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[#b02a6b] font-bold text-sm ml-2">Estilista</label>
                <select name="empleadoId" value={formData.empleadoId} onChange={handleChange} className="input-pripelu" required>
                  <option value="">Elige a tu profesional</option>
                  {empleados.map(emp => (
                    <option key={emp.id || emp.id_empleado} value={emp.id || emp.id_empleado}>{emp.nombre} {emp.apellido}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[#b02a6b] font-bold text-sm ml-2">Fecha</label>
                <input name="fecha" value={formData.fecha} onChange={handleChange} type="date" min={fechaMinima} className="input-pripelu" required />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[#b02a6b] font-bold text-sm ml-2">Hora preferida</label>
                <select name="hora" value={formData.hora} onChange={handleChange} disabled={!formData.empleadoId || !formData.fecha} className="input-pripelu" required>
                  <option value="">{!formData.empleadoId || !formData.fecha ? "Faltan datos" : horasDisponibles.length === 0 ? "❌ Sin horas" : "Selecciona hora"}</option>
                  {horasDisponibles.map(h => (<option key={h} value={h}>{h}</option>))}
                </select>
              </div>
              
              {formData.servicioId && (
                <div className="md:col-span-2 bg-pink-50 p-5 rounded-2xl flex justify-between items-center border border-pink-200 shadow-inner mt-2">
                  <div>
                    <p className="text-[#b02a6b] font-bold text-lg">Total del servicio: ${precioFinal}</p> 
                    <p className="text-sm text-gray-500 italic">Saldo a pagar en el local: ${saldoPendiente}</p>      
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#f171ab] uppercase font-bold tracking-widest">Abono Requerido Hoy</p>
                    <p className="text-3xl font-bold text-[#b02a6b]">${montoAbono}</p>
                  </div>
                </div>
              )}
              <button type="submit" className="md:col-span-2 bg-[#f171ab] text-white py-5 rounded-2xl font-bold text-lg shadow-lg hover:bg-[#d85a94] transition-all mt-4" disabled={horasDisponibles.length === 0 || !formData.servicioId}>
                Continuar al Pago
              </button>
            </form>
          )}
        </>
      )}

      {/* --- PASO 2: MODAL DE PAGO (TARJETA) --- */}
      {paso === 2 && (
        <div className="animate-fade-in text-center flex flex-col h-full justify-center">
          <button onClick={() => {
                  setPaso(1);
                  setErrorBackend('');
              }} 
              disabled={procesandoPago} 
              className="absolute top-6 left-6 text-pink-400 font-bold hover:text-pink-600 disabled:opacity-50 z-10">← Volver
          </button>
          
          <h2 className="text-3xl font-serif text-[#b02a6b] italic mb-2">Pago Seguro</h2>
          <p className="text-gray-500 text-sm mb-6">Ingresa tus datos para confirmar tu abono de <b>${montoAbono}</b>.</p>

          {/* Input de Pago */}
          <form onSubmit={handleEjecutarPago} className="space-y-4 max-w-sm mx-auto w-full text-left">
            <div className="flex flex-col gap-1">
              <label className="text-[#b02a6b] font-bold text-xs ml-2 uppercase">Número de Tarjeta</label>
              <input type="text" name="numero" placeholder="XXXX XXXX XXXX XXXX" maxLength="19" value={datosPago.numero} onChange={handlePagoChange} required disabled={procesandoPago} className="input-pripelu tracking-widest text-center" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[#b02a6b] font-bold text-xs ml-2 uppercase">Vencimiento</label>
                <input type="text" name="vencimiento" placeholder="MM/YY" maxLength="5" value={datosPago.vencimiento} onChange={handlePagoChange} required disabled={procesandoPago} className="input-pripelu text-center" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[#b02a6b] font-bold text-xs ml-2 uppercase">CVV</label>
                <input type="password" name="cvv" placeholder="***" maxLength="3" value={datosPago.cvv} onChange={handlePagoChange} required disabled={procesandoPago} className="input-pripelu text-center" />
              </div>
            </div>

            {errorBackend && <p className="text-red-500 text-xs text-center font-bold mt-2">{errorBackend}</p>}

            <button type="submit" disabled={procesandoPago} className={`w-full text-white py-4 rounded-2xl font-bold text-lg shadow-lg transition-all mt-6 ${procesandoPago ? 'bg-gray-400 animate-pulse cursor-wait' : 'bg-green-500 hover:bg-green-600'}`}>
              {procesandoPago ? 'Procesando Abono...' : `Pagar Abono de $${montoAbono}`}
            </button>
          </form>
        </div>
      )}

      {/* --- PASO 3: ÉXITO ABSOLUTO --- */}
      {paso === 3 && (
        <div className="animate-fade-in flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-2 animate-bounce">
            <span className="text-green-500 text-5xl">✓</span>
          </div>
          <h2 className="text-4xl font-serif text-green-600 italic">¡Reserva Exitosa!</h2>
          <p className="text-gray-600 text-lg">Tu abono de <b>${montoAbono}</b> fue aprobado.</p>
          <div className="bg-pink-50 text-[#b02a6b] px-6 py-3 rounded-2xl font-bold shadow-sm">
            Se te cobrará el resto (${saldoPendiente}) al completar la cita en el local.
          </div>
          <p className="text-pink-400 text-xs animate-pulse mt-4">Redirigiendo a tu agenda...</p>
          
        </div>
      )}

    </div>
  );
}