import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, Save, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MiCuenta() {
  const [perfil, setPerfil] = useState({  nombre: '', apellido: '', correo: '', telefono: '' });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  // Obtenemos el ID del usuario logueado
  const userId = localStorage.getItem('userId') || 1; 

  // 1. LECTURA (GET) - CP-02
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    fetch(`${baseUrl}/api/usuarios/${userId}`)
      .then(res => res.json())
      .then(data => { setPerfil(data); setCargando(false); })
      .catch(err => { console.error(err); setCargando(false); });
  }, [userId]);

  const handleChange = (e) => {
    setPerfil({ ...perfil, [e.target.name]: e.target.value });
  };

  // 2. ACTUALIZACIÓN (PUT) - CP-02
  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(`${baseUrl}/api/usuarios/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(perfil)
      });
      if (res.ok) {
        alert("✅ Perfil actualizado exitosamente");
      } else {
        alert("❌ Error al guardar los cambios");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Problemas de conexión con el servidor");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf2f8] p-4 md:p-8 flex justify-center items-center">
      <div className="max-w-xl w-full bg-white p-8 rounded-[3rem] shadow-2xl border border-pink-100">
        
        <div className="flex justify-between items-center mb-8">
          <Link to="/" className="text-[#f171ab] flex items-center gap-2 hover:underline font-bold">
            <ArrowLeft size={20} /> Volver
          </Link>
          <h1 className="text-3xl font-serif text-[#b02a6b] italic flex items-center gap-2">
            <User /> Mi Perfil
          </h1>
        </div>

        {cargando ? (
          <p className="text-center text-[#f171ab] font-bold py-10">Cargando tu información...</p>
        ) : (
          <form onSubmit={handleGuardar} className="space-y-5">
            


            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[#b02a6b] font-bold text-xs uppercase">Nombre</label>
                <input type="text" name="nombre" value={perfil.nombre} onChange={handleChange} className="w-full p-3 border rounded-xl border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[#b02a6b] font-bold text-xs uppercase">Apellido</label>
                <input type="text" name="apellido" value={perfil.apellido || ''} onChange={handleChange} className="w-full p-3 border rounded-xl border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#b02a6b] font-bold text-xs uppercase flex items-center gap-2"><Mail size={14}/> Correo Electrónico</label>
              <input type="email" name="correo" value={perfil.correo} onChange={handleChange} className="w-full p-3 border rounded-xl border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#b02a6b] font-bold text-xs uppercase flex items-center gap-2"><Phone size={14}/> Teléfono (+569)</label>
              <input type="tel" name="telefono" value={perfil.telefono} onChange={handleChange} maxLength="8" className="w-full p-3 border rounded-xl border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
            </div>

            <button type="submit" disabled={guardando} className="w-full bg-[#f171ab] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-[#d85a94] transition-all flex justify-center items-center gap-2 mt-6">
              <Save size={20} /> {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}