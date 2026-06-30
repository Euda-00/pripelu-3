import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    localStorage.clear();
    setErrorMsg(''); 

    // Limpieza de espacios invisibles por autocompletado
    const correoLimpio = email.trim();

    // Validación de presencia de datos en los campos del formulario
    if (!correoLimpio || !password.trim()) {
      setErrorMsg('Por favor, completa todos los campos.');
      return;
    }

    // Expresión regular para la verificación estricta del patrón de correo electrónico
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // Disparador de alerta visual en caso de detectar una sintaxis de correo incorrecta
    if (!emailRegex.test(correoLimpio)) {
      setErrorMsg('Estructura de correo inválida. Debe contener un carácter "@" seguido de un dominio calificado (ejemplo: usuario@gmail.com).');
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

      const respuesta = await fetch(`${baseUrl}/api/usuarios/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: correoLimpio,
          contrasena: password
        })
      });

      if (respuesta.ok) {
        const usuarioLogeado = await respuesta.json();
        
        // Persistencia de sesión y meta-datos del usuario en el almacenamiento local
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', usuarioLogeado.rol?.toLowerCase() || 'cliente');
        localStorage.setItem('userName', usuarioLogeado.nombre || 'Usuario');
        localStorage.setItem('userId', usuarioLogeado.id_usuario || usuarioLogeado.id);

        // Enrutamiento condicional basado en el rol del usuario autenticado
        if (usuarioLogeado.rol?.toLowerCase() === 'admin') {
          navigate('/admin');
        } else if (usuarioLogeado.rol?.toLowerCase() === 'empleado') {
          navigate('/mis-citas');
        } else {
          navigate('/');
        }
      } else {
        setErrorMsg('Credenciales incorrectas. Verifique el correo y la contraseña.');
      }
    } catch (error) {
      console.error("Falla en la conexión:", error);
      setErrorMsg('Error de conexión con el servidor. Verifique el estado del Backend.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf2f8] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-pink-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif text-[#b02a6b] italic mb-2">Bienvenida, Pri</h2>
          <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">Inicia sesión para gestionar</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          
          {/* Contenedor de excepciones y errores de validación */}
          {errorMsg && (
            <div className="bg-red-50 text-red-500 border border-red-200 p-3 rounded-xl text-sm font-bold text-center animate-in fade-in duration-200">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[#b02a6b] font-bold text-sm ml-2">Email</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-4 rounded-2xl border border-pink-100 outline-none focus:border-[#f171ab] bg-pink-50/30"
              placeholder="tu@email.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[#b02a6b] font-bold text-sm ml-2">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-4 rounded-2xl border border-pink-100 outline-none focus:border-[#f171ab] bg-pink-50/30"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            className="bg-[#f171ab] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-[#d85a94] transition-all mt-4"
          >
            Entrar al Panel
          </button>
          
          <p className="text-center mt-6 text-gray-500 text-sm">
            ¿No tienes cuenta? <a href="/register" className="text-[#f171ab] font-bold">Regístrate aquí</a>
          </p>
        </form>
      </div>
    </div>
  );
}