import React from 'react';
import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';

import MiCuenta from '../Pages/MiCuenta.jsx'; 

beforeEach(() => {
  localStorage.setItem('userId', '1');
  localStorage.setItem('userRole', 'cliente');
  window.alert = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks(); 
  localStorage.clear();
});

describe('Pruebas Funcionales - Gestión de Clientes (CP-02)', () => {

  test('CP-02: Debe permitir leer los datos de la cuenta y actualizarlos correctamente', async () => {
    
    // 1. EL MOCK: Simulamos la BD trayendo y guardando datos
    global.fetch = vi.fn((url, options) => {
      // A) GET inicial
      if (!options || options.method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, rut: '1111111-1', nombre: 'Tomas',apellido: 'Perez', correo: 'tomas@mail.com', telefono: '12345678' })
        });
      }
      
      // B) PUT al guardar
      if (options && options.method === 'PUT') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(
      <MemoryRouter>
        <MiCuenta />
      </MemoryRouter>
    );

    // 2. VERIFICACIÓN DE LECTURA (Read) - Usando DisplayValue
    const inputNombre = await screen.findAllByDisplayValue(/Tomas/i);
    const inputCorreo = await screen.findAllByDisplayValue(/tomas@mail.com/i);
    expect(inputNombre[0]).toBeInTheDocument();
    expect(inputCorreo[0]).toBeInTheDocument();

    // 3. ACTUALIZACIÓN (Update)
    // Como el formulario siempre es editable, vamos directo a cambiar el teléfono
    const inputTelefono = document.querySelector('input[name="telefono"]');
    fireEvent.change(inputTelefono, { target: { value: '98765432' } });

    // Presionamos el botón Guardar
    const btnGuardar = screen.getByRole('button', { name: /Guardar Cambios/i });
    fireEvent.click(btnGuardar);

    // 4. VERIFICACIÓN FINAL
    await waitFor(() => {
      const putCalls = global.fetch.mock.calls.filter(c => c[1] && c[1].method === 'PUT');
      expect(putCalls.length).toBe(1);

      // Verificamos que el teléfono nuevo se haya enviado en el paquete a Spring Boot
      const bodyEnviado = JSON.parse(putCalls[0][1].body);
      expect(bodyEnviado.telefono).toBe('98765432');
    });
  });

});