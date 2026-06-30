import React from 'react';
import { describe, test, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';


import ProtectedRoute from '../components/ProtectedRute.jsx'; 

describe('Pruebas de Seguridad - Rutas Protegidas (Control de Acceso)', () => {
  
  afterEach(() => {
    cleanup();
    // Limpiamos la memoria del navegador después de cada prueba para que no queden "sesiones fantasma"
    localStorage.clear(); 
  });

  test('SEG-01: Debe bloquear a un intruso sin sesión y redirigirlo obligatoriamente al Login', () => {
    // 1. Aseguramos que el usuario NO está autenticado (Simulamos a alguien que recién entra a la web)
    localStorage.removeItem('isAuthenticated');

    // 2. Armamos un mini-navegador. Simulamos que el intruso intenta tipear directamente "/admin"
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          {/* Esta es la ruta trampa a la que el guardia lo debe patear */}
          <Route path="/login" element={<h1>Acceso Denegado - Pantalla de Login</h1>} />
          
          {/* Esta es la ruta secreta que estamos protegiendo */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <h1>Panel Financiero Secreto</h1>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    // 3. VERIFICACIONES DE SEGURIDAD
    // El guardia debió detectar que no hay sesión y enviarlo a la pantalla de Login
    expect(screen.getByText(/Acceso Denegado - Pantalla de Login/i)).toBeInTheDocument();
    
    // Lo más importante: Los datos financieros NUNCA debieron renderizarse en el código HTML
    expect(screen.queryByText(/Panel Financiero Secreto/i)).not.toBeInTheDocument();
  });

  test('SEG-02: Debe permitir el paso al Dashboard si el usuario tiene una sesión válida', () => {
    // 1. Simulamos que el usuario hizo Login correctamente antes de llegar aquí
    localStorage.setItem('isAuthenticated', 'true');

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<h1>Acceso Denegado - Pantalla de Login</h1>} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <h1>Panel Financiero Secreto</h1>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    // 2. VERIFICACIONES DE ÉXITO
    // Como tiene las llaves (isAuthenticated = true), el sistema lo dejó pasar y ver los datos
    expect(screen.getByText(/Panel Financiero Secreto/i)).toBeInTheDocument();
    
    // Y obviamente, NO lo pateó de vuelta al login
    expect(screen.queryByText(/Acceso Denegado/i)).not.toBeInTheDocument();
  });

});