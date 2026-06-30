import React from 'react';
import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';

import GestionEmpleados from '../Pages/GestionEmpleados.jsx';

beforeEach(() => {
  // Silenciamos las alertas de "Empleado agregado con éxito" para que no interrumpan el test
  window.alert = vi.fn();
  window.confirm = vi.fn(() => true); 
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks(); 
});

describe('Pruebas Funcionales - Mantenimiento de Personal (Plan QA)', () => {

  test('CP-05: Debe permitir cargar, agregar y eliminar empleados (CRUD)', async () => {
    // 1. EL MOCK: Simulamos el backend usando los nombres exactos del Swagger
    global.fetch = vi.fn((url, options) => {
      if (!options || options.method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1, nombre: 'Ana', apellido: 'Gómez', especialidad: 'Estilista' }]) });
      }
      if (options && options.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 2, nombre: 'Tomas', apellido: 'Nuevo', especialidad: 'Estilista' }) });
      }
      if (options && options.method === 'DELETE') {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(<MemoryRouter><GestionEmpleados /></MemoryRouter>);

    // 1. Verificar carga (Read)
    const nombreCargado = await screen.findAllByText(/Ana Gómez/i);
    expect(nombreCargado[0]).toBeInTheDocument();

    // 2. Verificar agregado (Create)
    fireEvent.change(screen.getByPlaceholderText(/Nombre/i), { target: { value: 'Tomas' } });
    fireEvent.change(screen.getByPlaceholderText(/Apellido/i), { target: { value: 'Nuevo' } });
    fireEvent.click(screen.getByRole('button', { name: /Registrar Trabajador/i }));

    await waitFor(() => {
      // Verificamos que se llamó al POST
      const postCalls = global.fetch.mock.calls.filter(c => c[1] && c[1].method === 'POST' && c[0].includes('empleado'));
      expect(postCalls.length).toBe(1);
      
      // Verificamos que Vitest mandó el paquete con la palabra 'especialidad' y no 'cargo'
      const bodyEnviado = JSON.parse(postCalls[0][1].body);
      expect(bodyEnviado.especialidad).toBe('Estilista');
    });

    // 3. Verificar borrado (Delete)
    const btnEliminar = await screen.findAllByRole('button', { name: /Eliminar/i });
    fireEvent.click(btnEliminar[0]);

    await waitFor(() => {
      const deleteCalls = global.fetch.mock.calls.filter(c => c[1] && c[1].method === 'DELETE');
      expect(deleteCalls.length).toBe(1);
    });
  });

  test('CP-06: Debe permitir asignar un horario laboral a un empleado específico', async () => {
    // EL MOCK para los horarios
    global.fetch = vi.fn((url, options) => {
      if (!options || options.method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1, nombre: 'Ana', apellido: 'Gómez' }]) });
      }
      if (options && options.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ mensaje: "Horario asignado" }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(<MemoryRouter><GestionEmpleados /></MemoryRouter>);

    // Esperamos que cargue la lista de empleados en el selector
    await screen.findAllByText(/Ana Gómez/i);

    // 1. Seleccionamos el empleado "Ana Gómez"
    const selectEmpleado = screen.getByRole('combobox');
    fireEvent.change(selectEmpleado, { target: { value: '1' } });

    // 2. Modificamos las horas (buscamos los inputs de type="time")
    const inputsHora = document.querySelectorAll('input[type="time"]');
    if(inputsHora.length >= 2) {
        fireEvent.change(inputsHora[0], { target: { value: '09:00' } }); // Cambia la hora de inicio
    }

    // 3. Guardamos el horario
    fireEvent.click(screen.getByRole('button', { name: /Guardar Horario/i }));

    // 4. Verificamos que se envió el POST a la ruta de horarios
    await waitFor(() => {
      const postHorarios = global.fetch.mock.calls.filter(c => c[1] && c[1].method === 'POST' && c[0].includes('horarios'));
      expect(postHorarios.length).toBe(1);
    });
  });

});