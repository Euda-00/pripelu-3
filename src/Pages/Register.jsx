import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [errorMensaje, setErrorMensaje] = useState(''); 
  
  const navigate = useNavigate();

  // ==========================================
  // Formateador de Input Controlado (Máscara UX)
  // ==========================================
  const formatPhoneNumber = (value) => {
    // Extracción estricta de caracteres numéricos
    const digits = value.replace(/\D/g, '');
    const maxDigits = digits.substring(0, 11);

    // Aplicación de máscara condicional según longitud (+xx x xxxx xxxx)
    if (maxDigits.length === 0) return '';
    if (maxDigits.length <= 2) return `+${maxDigits}`;
    if (maxDigits.length <= 3) return `+${maxDigits.substring(0, 2)} ${maxDigits.substring(2)}`;
    if (maxDigits.length <= 7) return `+${maxDigits.substring(0, 2)} ${maxDigits.substring(2, 3)} ${maxDigits.substring(3)}`;
    return `+${maxDigits.substring(0, 2)} ${maxDigits.substring(2, 3)} ${maxDigits.substring(3, 7)} ${maxDigits.substring(7, 11)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setTelefono(formatted);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMensaje(''); 

    // ==========================================
    // Bloque de validación de integridad de datos
    // ==========================================

    // Verificación de presencia de datos obligatorios
    if (!nombre.trim() || !apellido.trim() || !email.trim() || !password.trim() || !telefono.trim()) {
      setErrorMensaje('Por favor, rellena todos los campos obligatorios.');
      return;
    }

    // Validación de formato alfabético para nombres (permite caracteres especiales del español)
    const letrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!letrasRegex.test(nombre) || !letrasRegex.test(apellido)) {
      setErrorMensaje('Error de sintaxis: El nombre y apellido solo deben contener caracteres alfabéticos.');
      return;
    }

    // Expresión regular para la verificación estricta del patrón de correo electrónico
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setErrorMensaje('Estructura de correo inválida. Debe contener un carácter "@" seguido de un dominio calificado (ejemplo: usuario@gmail.com).');
      return;
    }

    // Normalización y validación de formato telefónico estándar
    const telefonoLimpio = telefono.replace(/\s/g, ''); // Remueve la máscara visual para la validación lógica
    const telRegex = /^(\+?56)?9\d{8}$/;
    if (!telRegex.test(telefonoLimpio)) {
      setErrorMensaje('Formato de teléfono inválido. Utilice el estándar local (ej: +56 9 1234 5678).');
      return;
    }

    // Control de longitud mínima para credenciales de seguridad
    if (password.length < 6) {
      setErrorMensaje('Políticas de seguridad: La contraseña debe contener un mínimo de 6 caracteres.');
      return;
    }

    // ==========================================
    // Transmisión de payload al servidor
    // ==========================================
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const respuesta = await fetch(`${baseUrl}/api/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email: email.trim(),
          contrasena: password, 
          telefono: telefonoLimpio, // Se envía el dato normalizado al backend
          rol: 'cliente' 
        }),
      });

      if (respuesta.ok) {
        alert('¡Cuenta creada con éxito, máquina! Ahora inicia sesión.');
        navigate('/login'); 
      } else {
        const errorData = await respuesta.json().catch(() => ({}));
        setErrorMensaje(errorData.message || 'Conflicto de datos: El correo ya se encuentra registrado.');
      }
    } catch (error) {
      console.error('Excepción durante la persistencia del usuario:', error);
      setErrorMensaje('Error de conexión con el servidor. Verifique el estado del servicio Backend.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf2f8] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-pink-100">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-serif text-[#b02a6b] italic mb-2">Únete a PriPelu</h2>
          <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">Crea tu cuenta de cliente</p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          
          {/* Contenedor de excepciones y errores de validación */}
          {errorMensaje && (
            <div className="bg-red-50 text-red-500 border border-red-200 p-3 rounded-xl text-sm font-bold text-center animate-in fade-in duration-200">
              ⚠️ {errorMensaje}
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex flex-col gap-1 w-1/2">
              <label className="text-[#b02a6b] font-bold text-xs ml-2">Nombre</label>
              <input 
                type="text" 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="p-3 rounded-xl border border-pink-100 outline-none focus:border-[#f171ab] bg-pink-50/30 text-sm"
                placeholder="Tu nombre"
                required
              />
            </div>
            <div className="flex flex-col gap-1 w-1/2">
              <label className="text-[#b02a6b] font-bold text-xs ml-2">Apellido</label>
              <input 
                type="text" 
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className="p-3 rounded-xl border border-pink-100 outline-none focus:border-[#f171ab] bg-pink-50/30 text-sm"
                placeholder="Tu apellido"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[#b02a6b] font-bold text-sm ml-2">Email</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-3 rounded-xl border border-pink-100 outline-none focus:border-[#f171ab] bg-pink-50/30"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[#b02a6b] font-bold text-sm ml-2">Teléfono</label>
            <input 
              type="tel" 
              value={telefono}
              onChange={handlePhoneChange} // Inyección del interceptor de formato
              className="p-3 rounded-xl border border-pink-100 outline-none focus:border-[#f171ab] bg-pink-50/30"
              placeholder="+56 9 1234 5678"
              maxLength={15} // Límite estricto de caracteres para la máscara
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[#b02a6b] font-bold text-sm ml-2">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-3 rounded-xl border border-pink-100 outline-none focus:border-[#f171ab] bg-pink-50/30"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            className="bg-[#f171ab] text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-[#d85a94] transition-all mt-3"
          >
            Registrarse
          </button>
          
          <p className="text-center mt-4 text-gray-500 text-sm">
            ¿Ya tienes una cuenta? <a href="/login" className="text-[#f171ab] font-bold">Inicia sesión aquí</a>
          </p>
        </form>
      </div>
    </div>
  );
}