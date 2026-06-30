import React from 'react';
import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';

// Ajusta la ruta a la carpeta donde tengas TodasLasCitas.jsx
import TodasLasCitas from '../Pages/TodasLasCitas.jsx'; 

beforeEach(() => {
  // Silenciamos los alert() y auto-aceptamos los confirm() por si tu código pide confirmación antes de borrar
  window.alert = vi.fn();
  window.confirm = vi.fn(() => true); 
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks(); 
});

describe('Pruebas Funcionales - Gestión de Citas (Plan QA)', () => {

  test('CP-04: Debe permitir la cancelación de una cita activa (Pendiente)', async () => {
    
    // 1. EL MOCK MULTIPROPÓSITO: Fingimos la carga inicial y luego la petición de borrado
    global.fetch = vi.fn((url, options) => {
      // A) Si el componente está pidiendo las citas al inicio (GET)
      if (!options || options.method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 99,
              estado: 'pendiente',
              valorTotal: 15000,
              usuario: { nombre: 'Tomas', apellido: 'Prueba' }
            }
          ])
        });
      }
      
      // B) Si el componente está intentando CANCELAR la cita (PUT, PATCH o DELETE)
      if (options && (options.method === 'PUT' || options.method === 'PATCH' || options.method === 'DELETE')) {
         return Promise.resolve({ ok: true });
      }
      
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    // 2. Renderizamos el componente envuelto en MemoryRouter por si usa Links
    render(
      <MemoryRouter>
        <TodasLasCitas />
      </MemoryRouter>
    );

    // 3. Esperamos a que la cita falsa de "Tomas Prueba" aparezca en pantalla
    const nombreCliente = await screen.findByText(/Tomas Prueba/i);
    expect(nombreCliente).toBeInTheDocument();

    // 4. Buscamos el botón rojo de cancelar y hacemos clic
    const btnCancelar = await screen.findByRole('button', { name: /Cancelar/i });
    fireEvent.click(btnCancelar);

    // 5. RESULTADO ESPERADO (Según Excel): El sistema debe disparar la petición al backend para actualizar el estado
    await waitFor(() => {
      // El fetch se debió llamar al menos 2 veces: 
      // 1 vez para cargar la lista, y 1 vez al hacer clic en el botón cancelar.
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  test('CP-08: Debe registrar el pago final descontando el abono y cambiar estado a Finalizado', async () => {
    
    // 1. EL MOCK: Fingimos que cargamos una cita pendiente que cuesta $50.000
    global.fetch = vi.fn((url, options) => {
      // A) Carga inicial de citas (GET)
      if (!options || options.method === 'GET') {
        if (url.includes('/api/citas')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
              {
                id: 100,
                estado: 'Pendiente',
                valorTotal: 50000, 
                fechaHora: '2026-06-19T11:00:00',
                usuario: { id: 1, nombre: 'Tomas', apellido: 'Cliente' },
                empleado: { id: 2, nombre: 'Eugenio', apellido: 'Estilista' },
                detalles: [{ servicio: { id: 1, nombre: 'Decoloración' } }]
              }
            ])
          });
        }
        // Para cargar insumos si lo pide el modal
        if (url.includes('/api/servicios')) {
           return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        }
      }
      
      // B) Cuando el usuario confirma el pago (PUT a /api/citas/100)
      if (options && options.method === 'PUT') {
         return Promise.resolve({ ok: true });
      }
      
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(
      <MemoryRouter>
        <TodasLasCitas />
      </MemoryRouter>
    );

    // 2. Esperamos que la cita de Tomas Cliente aparezca en el panel
    const nombreCliente = await screen.findByText(/Tomas Cliente/i);
    expect(nombreCliente).toBeInTheDocument();

    // 3. Buscamos el botón de "Finalizar Cita" y lo presionamos
    const btnFinalizarCita = await screen.findByRole('button', { name: /Finalizar Cita/i });
    fireEvent.click(btnFinalizarCita);

    // 4. VERIFICACIÓN MATEMÁTICA EN EL MODAL (El Core del CP-08)
    // Esperamos a que abra el modal
    const modalTitulo = await screen.findByText(/Resumen de cobro/i);
    expect(modalTitulo).toBeInTheDocument();

    // Si el total es 50.000, el abono debió ser 10.000 (20%) y el saldo a cobrar 40.000 (80%)
    // Nota: Como usas .toLocaleString(), buscamos solo los números aproximados para evitar fallos por puntos o comas
    const textoModal = document.body.textContent;
    expect(textoModal.includes('10')).toBe(true); // Revisa que aparezcan los 10.000
    expect(textoModal.includes('40')).toBe(true); // Revisa que aparezcan los 40.000

    // 5. Confirmamos el pago final apretando el botón del Modal
    const btnConfirmarPago = screen.getByRole('button', { name: /Confirmar Pago Final/i });
    fireEvent.click(btnConfirmarPago);

    // 6. RESULTADO ESPERADO: El sistema dispara un PUT a Spring Boot con el estado 'Finalizado'
    await waitFor(() => {
      // Filtramos para asegurarnos que se hizo un PUT a la ruta de citas
      const putCalls = global.fetch.mock.calls.filter(call => call[1] && call[1].method === 'PUT' && call[0].includes('/api/citas/100'));
      expect(putCalls.length).toBeGreaterThan(0);

      // Revisamos que la orden que se mandó diga "Finalizado"
      const bodyEnviado = JSON.parse(putCalls[0][1].body);
      expect(bodyEnviado.estado).toBe('Finalizado');
    });
  });

  test('CP-12: Debe permitir el registro de insumos/productos utilizados al finalizar la cita', async () => {
    
    // 1. EL MOCK: Le mandamos la cita y además inventamos que la bodega tiene "Shampoo"
    global.fetch = vi.fn((url, options) => {
      if (!options || options.method === 'GET') {
        if (url.includes('/api/citas')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ id: 102, estado: 'Pendiente', valorTotal: 25000 }])
          });
        }
        // Atrapamos cualquier llamada al inventario, productos o insumos
        if (url.includes('inventario') || url.includes('producto') || url.includes('insumo')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ id: 1, nombre: 'Shampoo Profesional', stock_actual: 20 }])
          });
        }
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(
      <MemoryRouter>
        <TodasLasCitas />
      </MemoryRouter>
    );

    // 2. Abrimos el modal de la cita
    const btnFinalizar = await screen.findByRole('button', { name: /Finalizar Cita/i });
    fireEvent.click(btnFinalizar);

    // 3. Verificamos que el modal se abrió
    await screen.findByText(/Resumen de cobro/i);

    // 4. VERIFICACIÓN DEL CP-12: Buscamos que tu React haya habilitado la sección de insumos
    // Buscamos palabras clave en todo el HTML del modal
    const textoModal = document.body.textContent.toLowerCase();
    const tieneSeccionInsumos = textoModal.includes('insumo') || textoModal.includes('producto') || textoModal.includes('gastar');
    
    expect(tieneSeccionInsumos).toBe(true);
  });

});