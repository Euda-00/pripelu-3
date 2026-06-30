import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Play, MapPin, Phone, Clock, LogOut, Settings, Calendar, ClipboardList, Scissors } from 'lucide-react';
import { floresData } from '../data'; 
import { TarjetaEquipo } from '../components/TarjetasEquipo';
import { FloatingFlower } from '../components/Flores';
import { Comparador } from '../components/Comparador';
import '../styles/pripelu.css'; 
import { Link, useNavigate } from 'react-router-dom';

export default function LandingPage({ onStartBooking }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  
  // --- NUEVO: ESPÍA PARA CERRAR EL MENÚ ---
  const dropdownRef = useRef(null);

  // --- ESTADOS PARA DATOS DE MYSQL ---
  const [servicios, setServicios] = useState([]);
  const [empleados, setEmpleados] = useState([]); 
  const [cargando, setCargando] = useState(true);

  const isAuth = localStorage.getItem('isAuthenticated') === 'true';
  const userRole = localStorage.getItem('userRole'); 

  // --- NUEVO: EFECTO PARA CLICK OUTSIDE ---
  useEffect(() => {
    const handleClickFuera = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    // Le decimos a React que pregunte si "document" existe antes de usarlo
    if (typeof document !== 'undefined') {
      document.addEventListener('mousedown', handleClickFuera);
      
      // La función de limpieza también protegida
      return () => {
        document.removeEventListener('mousedown', handleClickFuera);
      };
    }
  }, []);

  // --- CARGA DE DATOS AL INICIAR ---
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

        const resServ = await fetch(`${baseUrl}/api/servicios`);
        if (resServ.ok) setServicios(await resServ.json());

        const resEmp = await fetch(`${baseUrl}/api/empleado`); 
        if (resEmp.ok) {
          const dataEmp = await resEmp.json();
          setEmpleados(Array.isArray(dataEmp) ? dataEmp : []);
        }
        
      } catch (error) {
        console.error('Error conectando con el backend:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setShowDropdown(false);
    navigate('/');
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen bg-[#fdf2f8] relative overflow-x-hidden font-sans">
      
      {/* DECORACIÓN DE FONDO */}
      {floresData.map((f) => (
        <FloatingFlower key={f.id} {...f} />
      ))}

      {/* --- NAVEGACIÓN FIXED EFECTO CRISTAL (Limpio) --- */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 py-4 bg-white/40 backdrop-blur-md border-b border-white/50 shadow-sm transition-all duration-300">
         <div className="flex items-center gap-3">
          <img 
            src="/logo-pripelu-gold-mini.png" 
            alt="PriPelu Logo" 
            className="nav-logo"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          />
        </div>
        
        <div className="nav-links-container">
          {['Inicio', 'Servicios', 'Equipo', 'Galería'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="nav-link">
              {item}
            </a>
          ))}
        </div>

        <div className="relative">
          {isAuth ? (
            // NUEVO: Agregamos el ref al contenedor del dropdown
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="btn-avatar"
              >
                {userRole === 'admin' ? 'A' : userRole === 'empleado' ? 'E' : 'U'}
              </button>

              {showDropdown && (
                // NUEVO: Clases absolute, z-50 y shadow-2xl para que el menú flote
                <div className="absolute right-0 top-[120%] w-56 bg-white rounded-2xl shadow-2xl border border-pink-100 overflow-hidden z-50 flex flex-col">
                  <div className="p-4 border-b border-gray-50 bg-pink-50/20 text-center">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Mi Cuenta</p>
                    <p className="text-[#b02a6b] text-xs font-bold italic">
                      {userRole === 'admin' && 'Administradora'}
                      {userRole === 'empleado' && 'Staff PriPelu'}
                      {userRole === 'cliente' && 'Cliente'}
                    </p>
                  </div>
                  
                  <Link to="/mis-citas" onClick={() => setShowDropdown(false)} className="px-4 py-3 text-sm text-gray-600 hover:bg-pink-50 flex items-center gap-2 border-b border-gray-50">
                    <Calendar size={16} className="text-[#f171ab]"/> Mis Citas
                  </Link>

                  {userRole === 'admin' && (
                    <Link to="/admin" onClick={() => setShowDropdown(false)} className="px-4 py-3 text-sm text-[#b02a6b] hover:bg-pink-50 flex items-center gap-2 font-bold border-b border-gray-50">
                      <Settings size={16} /> Panel de Gestión
                    </Link>
                  )}

                  {userRole === 'empleado' && (
                    <Link to="/mis-citas" onClick={() => setShowDropdown(false)} className="px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-bold border-b border-gray-50">
                      <ClipboardList size={16} /> Ver Mi Agenda
                    </Link>
                  )}

                  <Link to="/mi-cuenta" onClick={() => setShowDropdown(false)} className="px-4 py-3 text-sm text-gray-600 hover:bg-pink-50 flex items-center gap-2 border-b border-gray-50">
                    <User size={16} className="text-[#f171ab]" /> Mi Cuenta
                  </Link>
                  
                  <button onClick={handleLogout} className="px-4 py-3 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 w-full text-left font-bold transition-colors">
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-nav flex items-center gap-2">
              <span>🔒</span> Iniciar Sesión
            </Link>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <header id="inicio" className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] text-center px-4 pt-32">
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-pink-100/60 backdrop-blur-sm text-[#f171ab] px-5 py-1 rounded-full text-xs font-bold mb-8 flex items-center gap-2">
          ✨ Experiencia Premium en Belleza
        </motion.div>

        <motion.img initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} src="/logo-pripelu-gold.png" alt="PriPelu Gold" className="w-[280px] md:w-[500px] drop-shadow-2xl mb-10" />

        <p className="max-w-2xl text-gray-600 text-lg md:text-xl font-medium mb-12">
          Donde tu estilo cobra vida. Transformamos tu imagen con técnicas innovadoras y productos de alta gama.
        </p>

        <div className="flex flex-col md:flex-row gap-5 mb-16">
          <button onClick={onStartBooking} className="btn-primary">Reserva tu Transformación</button>
          <button className="btn-secondary">
            <div className="bg-[#f171ab] p-1 rounded-full text-white"><Play size={16} fill="white" /></div>
            Ver Video
          </button>
        </div>

        <div className="mt-auto pb-10">
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="border-2 border-pink-300 w-7 h-12 rounded-full flex justify-center p-1.5">
            <motion.div animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1 h-3 bg-pink-400 rounded-full" />
          </motion.div>
        </div>
      </header>

      {/* --- SECCIÓN SERVICIOS --- */}
      <section id="servicios" className="section-container bg-white rounded-t-[4rem] shadow-2xl">
        <div className="section-title-wrapper">
          <p className="section-subtitle">Nuestros Servicios</p>
          <h2 className="section-title">Experiencias Únicas</h2>
        </div>
        
        {cargando ? (
           <p className="text-center text-[#f171ab] font-bold text-xl py-10">Cargando catálogo...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto">
            {servicios.map((s) => (
              <motion.div key={s.id || s.id_servicio} whileHover={{ y: -10 }} className="card-pripelu group">
                <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center text-[#f171ab] mb-6 group-hover:bg-[#f171ab] group-hover:text-white transition-all">
                  <Scissors size={28} /> 
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">{s.nombre}</h3>
                <p className="text-gray-500 text-sm italic mb-8 h-10 overflow-hidden">{s.descripcion}</p>
                <div className="flex justify-between items-center border-t border-pink-50 pt-8">
                  <span className="text-[#f171ab] font-bold text-xl italic">${s.precio?.toLocaleString()}</span>
                  <span className="text-xs text-gray-400 font-bold">{s.duracion_min || s.duracionMinutos} min</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* --- SECCIÓN EQUIPO --- */}
      <section id="equipo" className="section-container bg-[#fdf2f8]">
        <div className="section-title-wrapper">
          <p className="section-subtitle">Profesionales</p>
          <h2 className="section-title text-[#f171ab]">Artistas del Cabello</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl mx-auto">
          {cargando ? (
            <p className="col-span-3 text-center text-[#f171ab] font-bold">Buscando a nuestros talentos...</p>
          ) : Array.isArray(empleados) && empleados.length > 0 ? (
            empleados.map((persona) => (
              <TarjetaEquipo key={persona.id || persona.id_empleado} persona={persona} />
            ))
          ) : (
            <p className="col-span-3 text-center text-gray-400">Próximamente conocerás a nuestro staff...</p>
          )}
        </div>
      </section>

      {/* GALERÍA */}
      <section id="galería" className="section-container bg-white">
         <div className="section-title-wrapper">
          <p className="section-subtitle">Resultados Reales</p>
          <h2 className="section-title">Transformaciones Mágicas</h2>
        </div>
        
        {/* AGREGAMOS ESTE DIV ENVOLVEDOR LIMPIO */}
        <div className="comparador-seccion-wrapper">
          <Comparador antes="/tu-foto-antes.jpg" despues="/tu-foto-despues.jpg" />
        </div>
      </section>

      {/* CONTACTO */}
      <section className="section-container bg-[#fdf2f8]">
         <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-xl overflow-hidden border border-pink-100 flex flex-col md:flex-row">
          <div className="p-12 md:w-1/2">
            <p className="section-subtitle">Encuéntranos</p>
            <h2 className="text-3xl font-bold text-gray-800 mb-8 italic">Visítanos en Maipú</h2>
            <div className="space-y-6">
              <ContactInfo icon={<MapPin size={20}/>} title="Dirección" content="Maipú, Santiago." />
              <ContactInfo icon={<Phone size={20}/>} title="WhatsApp" content="+56 9 1234 5678" />
              <ContactInfo icon={<Clock size={20}/>} title="Horario" content="Mar - Sáb: 10:00 - 19:00 hrs" />
            </div>
          </div>
          <div className="bg-[#f171ab] p-12 md:w-1/2 flex flex-col items-center justify-center text-center text-white">
            <h3 className="text-2xl font-bold mb-4 italic">¿Lista para un cambio?</h3>
            <button onClick={onStartBooking} className="bg-white text-[#f171ab] px-10 py-4 rounded-full font-bold shadow-lg hover:bg-pink-50 transition-all">
              Agendar ahora
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-white py-12 text-center text-gray-400 text-xs border-t border-pink-50">
        <p>© 2026 PriPelu Studio. Maipú, Santiago.</p>
      </footer>
    </div>
  );
}

const ContactInfo = ({ icon, title, content }) => (
  <div className="flex items-start gap-4">
    <div className="bg-pink-50 p-3 rounded-2xl text-[#f171ab]">{icon}</div>
    <div>
      <h4 className="font-bold text-gray-800">{title}</h4>
      <p className="text-gray-500 text-sm italic">{content}</p>
    </div>
  </div>
);