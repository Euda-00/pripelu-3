import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, Trash2, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GestionEmpleados() {
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nuevoEmpleado, setNuevoEmpleado] = useState({ nombre: '', apellido: '', especialidad: 'Estilista' });
  const [horario, setHorario] = useState({ empleadoId: '', diaSemana: '1', horaInicio: '10:00', horacierre: '19:00' });

  // 1. Cargar Empleados
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    fetch(`${baseUrl}/api/empleado`)
      .then(res => res.json())
      .then(data => { setEmpleados(data); setCargando(false); })
      .catch(() => setCargando(false));
  }, []);

  // 2. Agregar Empleado (CRUD - CP-05)
    const handleAgregarEmpleado = async (e) => {
    e.preventDefault();
    try {
      // Armamos el paquete EXACTO como lo pide el Swagger
      const payload = {
        nombre: nuevoEmpleado.nombre,
        apellido: nuevoEmpleado.apellido,
        especialidad: nuevoEmpleado.especialidad,
        activo: true,
        horarios: [] // Lo mandamos vacío por ahora, se llena en el módulo de abajo
      };

      const res = await fetch(`${baseUrl}/api/empleado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const creado = await res.json();
        setEmpleados([...empleados, creado]);
        setNuevoEmpleado({ nombre: '', apellido: '', especialidad: 'Estilista' });
        alert("✅ Empleado agregado con éxito");
      } else {
        const textoError = await res.text();
        console.error("🚨 Error del servidor:", textoError);
        alert(`❌ Falló la creación. Detalle: ${textoError}`);
      }
    } catch (error) {
      console.error(error);
    }
    };

  // 3. Eliminar Empleado (CRUD - CP-05)
  const handleEliminarEmpleado = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar a este trabajador?")) return;
    try {
      const res = await fetch(`${baseUrl}/api/empleado/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEmpleados(empleados.filter(emp => (emp.id || emp.id_empleado) !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 4. Asignar Horario (CP-06)
  const handleAsignarHorario = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${baseUrl}/api/horarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empleado: { id: parseInt(horario.empleadoId) },
          diaSemana: parseInt(horario.diaSemana),
          horaInicio: horario.horaInicio,
          horacierre: horario.horacierre,
          horaInicioAlmuerzo: "14:00",
          horaFinAlmuerzo: "15:00"
        })
      });
      if (res.ok) alert("⏰ Horario asignado correctamente");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf2f8] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center">
          <Link to="/dashboard" className="text-[#f171ab] flex items-center gap-2 hover:underline font-bold">
            <ArrowLeft size={20} /> Volver al Dashboard
          </Link>
          <h1 className="text-3xl font-serif text-[#b02a6b] italic flex items-center gap-2">
            <Users /> Gestión del Staff
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* MÓDULO 1: Agregar Empleado (CP-05) */}
          <div className="bg-white p-6 rounded-[2rem] shadow-md border border-pink-100">
            <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2"><UserPlus className="text-[#f171ab]"/> Nuevo Empleado</h2>
            <form onSubmit={handleAgregarEmpleado} className="space-y-4">
              <input type="text" placeholder="Nombre" value={nuevoEmpleado.nombre} onChange={e => setNuevoEmpleado({...nuevoEmpleado, nombre: e.target.value})} className="w-full p-3 border rounded-xl" required />
              <input type="text" placeholder="Apellido" value={nuevoEmpleado.apellido} onChange={e => setNuevoEmpleado({...nuevoEmpleado, apellido: e.target.value})} className="w-full p-3 border rounded-xl" required />
              <button type="submit" className="w-full bg-[#f171ab] text-white py-3 rounded-xl font-bold hover:bg-[#d85a94]">Registrar Trabajador</button>
            </form>
          </div>

          {/* MÓDULO 2: Asignar Horario (CP-06) */}
          <div className="bg-white p-6 rounded-[2rem] shadow-md border border-pink-100">
            <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2"><Clock className="text-[#f171ab]"/> Asignar Horario</h2>
            <form onSubmit={handleAsignarHorario} className="space-y-4">
              <select value={horario.empleadoId} onChange={e => setHorario({...horario, empleadoId: e.target.value})} className="w-full p-3 border rounded-xl" required>
                <option value="">Seleccionar Empleado</option>
                {empleados.map(emp => <option key={emp.id || emp.id_empleado} value={emp.id || emp.id_empleado}>{emp.nombre} {emp.apellido}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="time" value={horario.horaInicio} onChange={e => setHorario({...horario, horaInicio: e.target.value})} className="p-3 border rounded-xl" title="Hora Inicio" required />
                <input type="time" value={horario.horacierre} onChange={e => setHorario({...horario, horacierre: e.target.value})} className="p-3 border rounded-xl" title="Hora Fin" required />
              </div>
              <button type="submit" className="w-full bg-[#b02a6b] text-white py-3 rounded-xl font-bold hover:bg-pink-900">Guardar Horario</button>
            </form>
          </div>

        </div>

        {/* LISTA DE EMPLEADOS (CP-05) */}
        <div className="bg-white p-6 rounded-[2rem] shadow-md border border-pink-100">
          <h2 className="text-xl font-bold text-gray-700 mb-4">Nómina Activa</h2>
          {cargando ? <p>Cargando staff...</p> : (
            <div className="grid gap-3">
              {empleados.map(emp => (
                <div key={emp.id || emp.id_empleado} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border">
                  <div>
                    <p className="font-bold text-gray-800">{emp.nombre} {emp.apellido}</p>
                    <p className="text-xs text-gray-500">{emp.especialidad}</p>
                  </div>
                  <button aria-label="Eliminar" onClick={() => handleEliminarEmpleado(emp.id || emp.id_empleado)} className="text-red-500 hover:bg-red-100 p-2 rounded-lg">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}