import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'; 
import LandingPage from './Pages/LandingPage';
import Dashboard from './Pages/Dashboard';
import BookingForm from './Pages/BookingForm'; 
import Login from './Pages/Login';
import ProtectedRoute from './components/ProtectedRute'; 
import Register from './Pages/Register';
import StaffDashboard from './Pages/StaffDashboard';
import TodasLasCitas from './Pages/TodasLasCitas';
import AdminReports from './Pages/AdminReports';
import GestionEmpleados from './Pages/GestionEmpleados'; 
import MiCuenta from './Pages/MiCuenta';

// 1. IMPORTA EL CATÁLOGO DESDE LA CARPETA PAGES
import Servicios from './components/Servicios'; 

function App() {
  const [showModal, setShowModal] = useState(false);

  const handleOpenModal = () => {
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    
    if (isAuth) {
      setShowModal(true); 
    } else {
      alert("Para agendar tu cita, primero debes iniciar sesión o crear una cuenta");
      window.location.href = '/login'; 
    }
  };
  
  const handleCloseModal = () => setShowModal(false);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage onStartBooking={handleOpenModal} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/citas" element={<ProtectedRoute><TodasLasCitas /></ProtectedRoute>} />
        <Route path="/admin/reportes" element={<AdminReports />} />
        <Route path="/admin/empleados" element={<GestionEmpleados />} />
        <Route path="/mi-cuenta" element={<ProtectedRoute><MiCuenta /></ProtectedRoute>} />

        
        {/* 2. LA NUEVA RUTA DEL CATÁLOGO */}
        <Route path="/servicios" element={<Servicios />} />

        <Route 
          path="/mis-citas" 
          element={
            <ProtectedRoute>
              <StaffDashboard /> 
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
        }/>
      </Routes>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <BookingForm 
            onBookingComplete={handleCloseModal} 
            onClose={handleCloseModal} 
          />
        </div>
      )}
    </Router>
  );
}

export default App;