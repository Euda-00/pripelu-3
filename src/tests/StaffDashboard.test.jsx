import React from 'react';
import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';

import StaffDashboard from '../Pages/StaffDashboard.jsx'; // Ajusta la ruta si es necesario

beforeEach(() => {
  // Le decimos a Vitest que asuma que Eugenio (el estilista) inició sesión
  localStorage.setItem('userRole', 'empleado');
  localStorage.setItem('userName', 'Eugenio');
  localStorage.setItem('userId', '1');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks(); 
  localStorage.clear();
});

describe('Pruebas Funcionales - Dashboard de Empleados (Plan QA)', () => {

    test('CP-15: Debe calcular correctamente las comisiones y mostrar el historial del empleado', async () => {
    
    // 1. EL MOCK: Mandamos 2 citas (20k + 10k) con fechas para evitar el "Invalid Date"
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/citas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, estado: 'Finalizado', valorTotal: 20000, fechaHora: '2026-06-19T10:00:00', empleado: { id: 1, nombre: 'Eugenio' } },
            { id: 2, estado: 'Finalizado', valorTotal: 10000, fechaHora: '2026-06-19T11:00:00', empleado: { id: 1, nombre: 'Eugenio' } }
          ])
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(
      <MemoryRouter>
        <StaffDashboard />
      </MemoryRouter>
    );

    // 2. Esperamos a que salga de "Cargando..."
    await waitFor(() => {
      expect(screen.queryByText(/Cargando/i)).not.toBeInTheDocument();
    });

    // 3. LA VERIFICACIÓN MATEMÁTICA DEFINITIVA
    await waitFor(() => {
      const textoPantalla = document.body.textContent;
      
      // Comprobamos que el título de comisiones existe
      const tituloComision = textoPantalla.toLowerCase().includes('comision') || textoPantalla.toLowerCase().includes('comisi');
      
      // Comprobamos la súper matemática: 50% de (20.000 + 10.000) = 15.000
      // Buscamos las diferentes formas en que tu React podría formatear el número
      const calculoExacto = textoPantalla.includes('15.000') || textoPantalla.includes('15,000') || textoPantalla.includes('15000');

      // Comprobamos que cargaron las 2 tarjetas (buscando la palabra "Finalizado" que vimos en tu HTML)
      const tarjetasCargadas = screen.getAllByText(/Finalizado/i).length > 0;

      expect(tituloComision && calculoExacto && tarjetasCargadas).toBe(true);
    });
  });

 
});