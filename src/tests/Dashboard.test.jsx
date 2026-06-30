import React from 'react';
import { describe, test, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';

import Dashboard from '../Pages/Dashboard.jsx'; 

afterEach(() => {
  cleanup();
  vi.restoreAllMocks(); 
});

describe('Pruebas Funcionales - Control de Bodega e Inventario (Plan QA)', () => {

  test('CP-13: Debe cargar el inventario y calcular correctamente las alertas de "Stock Crítico"', async () => {
    
    // 1. EL MOCK: Simulamos la respuesta del backend para las citas y el inventario
    global.fetch = vi.fn((url) => {
      // Fingimos que no hay citas para no distraer al test
      if (url.includes('/api/citas')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      
      // Le mandamos un producto sano (45) y uno crítico (5)
      if (url.includes('/api/inventarios')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, nombre: 'Shampoo Cuidado Profundo', stock_actual: 45 },
            { id: 2, nombre: 'Tintura Fantasía Rosa', stock_actual: 5 }
          ])
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    // 2. Renderizamos el Dashboard 
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // 3. Verificamos que el sistema intente conectarse al menos a las dos tablas (sea citas e inventario)
    expect(global.fetch).toHaveBeenCalled();

    // 4. Esperamos que el mensaje de "Conectando con la bodega" desaparezca
    await waitFor(() => {
      expect(screen.queryByText(/Conectando con la bodega.../i)).not.toBeInTheDocument();
    });

    // 5. RESULTADOS ESPERADOS 
    // Comprobamos que los dos productos se dibujaron en la tabla
    expect(screen.getByText(/Shampoo Cuidado Profundo/i)).toBeInTheDocument();
    expect(screen.getByText(/Tintura Fantasía Rosa/i)).toBeInTheDocument();

    // Comprobamos que el sistema evaluó correctamente la regla de los <= 10
    const alertaCritica = screen.getByText(/Stock Crítico/i);
    const estadoOptimo = screen.getByText(/Óptimo/i);

    expect(alertaCritica).toBeInTheDocument();
    expect(estadoOptimo).toBeInTheDocument();
  });

});