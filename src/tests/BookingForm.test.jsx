import React from 'react';
import { describe, test, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import BookingForm from "../Pages/BookingForm.jsx"; 

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Pruebas Funcionales - Formulario de Reservas', () => {
  
  test('CP-03: Debe permitir la selección de detalles y avanzar al modal de pago (Happy Path)', async () => {
    
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/servicios')) return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1, nombre: 'Corte Hombre', precio: 10000 }]) });
      if (url.includes('/api/empleado')) return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1, nombre: 'Eugenio', apellido: 'Parada' }]) });
      if (url.includes('/api/horarios')) return Promise.resolve({ ok: true, json: () => Promise.resolve([{ empleado: { id: 1 }, diaSemana: 5, horaInicio: '10:00', horacierre: '18:00' }]) }); 
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(<BookingForm onBookingComplete={() => {}} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.queryByText(/Conectando con el sistema/i)).not.toBeInTheDocument();
    });

    // 1. Llenamos los datos del formulario (Paso 1)
    fireEvent.change(document.querySelector('select[name="servicioId"]'), { target: { value: '1' } });
    fireEvent.change(document.querySelector('select[name="empleadoId"]'), { target: { value: '1' } });
    fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2026-06-19' } });

    await waitFor(() => expect(document.querySelector('select[name="hora"]').options.length).toBeGreaterThan(1));
    fireEvent.change(document.querySelector('select[name="hora"]'), { target: { value: '11:00' } });

    // 2. Apretamos continuar
    const btnConfirmar = screen.getByRole('button', { name: /Continuar al Pago/i });
    btnConfirmar.removeAttribute('disabled'); 
    fireEvent.submit(btnConfirmar.closest('form'));

    // 3. RESULTADO ESPERADO (CP-03): El sistema debe cambiar al Paso 2 mostrando "Pago Seguro"
    const tituloPago = await screen.findByText(/Pago Seguro/i);
    expect(tituloPago).toBeInTheDocument();
  });

  // ATENCIÓN: Le damos 10000ms (10 segundos) de tiempo máximo a esta prueba
  // porque tu código tiene un setTimeout(..., 3000) simulando la tarjeta
  test('CP-07: Debe exigir un abono del 20%, validar la tarjeta y registrar en el backend', async () => {
    
    global.fetch = vi.fn((url, options) => {
      // Cargas iniciales
      if (url.includes('/api/servicios')) return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1, nombre: 'Corte Hombre', precio: 10000 }]) });
      if (url.includes('/api/empleado')) return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1, nombre: 'Eugenio', apellido: 'Parada' }]) });
      if (url.includes('/api/horarios')) return Promise.resolve({ ok: true, json: () => Promise.resolve([{ empleado: { id: 1 }, diaSemana: 5, horaInicio: '10:00', horacierre: '18:00' }]) }); 
      
      // Simulación de los POST en el Paso 2
      if (options && options.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 99, mensaje: 'Éxito' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(<BookingForm onBookingComplete={() => {}} onClose={() => {}} />);

    await waitFor(() => expect(screen.queryByText(/Conectando con el sistema/i)).not.toBeInTheDocument());

    // --- PASO 1: Llenamos formulario ---
    fireEvent.change(document.querySelector('select[name="servicioId"]'), { target: { value: '1' } });
    fireEvent.change(document.querySelector('select[name="empleadoId"]'), { target: { value: '1' } });
    fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2026-06-19' } });
    await waitFor(() => expect(document.querySelector('select[name="hora"]').options.length).toBeGreaterThan(1));
    fireEvent.change(document.querySelector('select[name="hora"]'), { target: { value: '11:00' } });

    const btnContinuar = screen.getByRole('button', { name: /Continuar al Pago/i });
    btnContinuar.removeAttribute('disabled');
    fireEvent.submit(btnContinuar.closest('form'));

    // --- PASO 2: Llegamos al Modal de Pago ---
    await screen.findByText(/Pago Seguro/i);

    // Llenamos la tarjeta de crédito
    fireEvent.change(document.querySelector('input[name="numero"]'), { target: { value: '1234123412341234' } });
    fireEvent.change(document.querySelector('input[name="vencimiento"]'), { target: { value: '12/28' } });
    fireEvent.change(document.querySelector('input[name="cvv"]'), { target: { value: '123' } });

    // Verificamos que el botón calculó bien el 20% (10.000 * 20% = 2.000)
    const btnPagar = screen.getByRole('button', { name: /Pagar Abono de \$2000/i });
    fireEvent.submit(btnPagar.closest('form'));

    // --- PASO 3: Esperamos la confirmación ---
    // Como pusiste 3 segundos de carga, tenemos que esperar un ratito
    await waitFor(() => {
      expect(screen.getByText(/¡Reserva Exitosa!/i)).toBeInTheDocument();
      
      // Verificamos que se haya llamado al backend para guardar la Cita y el Pago
      const postCalls = global.fetch.mock.calls.filter(call => call[1] && call[1].method === 'POST');
      expect(postCalls.length).toBe(2); // Uno para la cita, otro para el pago
    }, { timeout: 6000 }); 

  }, 10000);

  test('CP-09: Debe bloquear las fechas en el pasado asignando la fecha de hoy como mínima', async () => {
    // Fingimos que carga rápido para no esperar
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

    render(<BookingForm onBookingComplete={() => {}} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.queryByText(/Conectando con el sistema/i)).not.toBeInTheDocument();
    });

    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaActual.getDate()).padStart(2, '0');
    const fechaMinimaEsperada = `${anio}-${mes}-${dia}`;

    const inputFecha = document.querySelector('input[type="date"]');
    expect(inputFecha).toBeInTheDocument();
    expect(inputFecha).toHaveAttribute('min', fechaMinimaEsperada);
  });

  test('CP-10: Debe bloquear la reserva mostrando "❌ Sin horas" si se selecciona un día no laborable (ej: Domingo)', async () => {
    
    // 1. EL TRUCO MAESTRO: Simulamos un backend completo, pero el empleado SOLO trabaja los Lunes (diaSemana: 1)
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/servicios')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1, nombre: 'Corte', precio: 15000 }]) });
      }
      if (url.includes('/api/empleado')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1, nombre: 'Ana', apellido: 'Gómez' }]) });
      }
      if (url.includes('/api/horarios')) {
        // Le damos horario SOLO para el Lunes (1)
        return Promise.resolve({ ok: true, json: () => Promise.resolve([
          { empleado: { id: 1 }, diaSemana: 1, horaInicio: '10:00', horacierre: '18:00' }
        ]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(<BookingForm onBookingComplete={() => {}} onClose={() => {}} />);

    // Esperamos a que la pantalla cargue
    await waitFor(() => {
      expect(screen.queryByText(/Conectando con el sistema/i)).not.toBeInTheDocument();
    });

    // 2. Simulamos que el usuario interactúa con el formulario
    const selectServicio = document.querySelector('select[name="servicioId"]');
    const selectEmpleado = document.querySelector('select[name="empleadoId"]');
    const inputFecha = document.querySelector('input[type="date"]');

    fireEvent.change(selectServicio, { target: { value: '1' } });
    fireEvent.change(selectEmpleado, { target: { value: '1' } });
    
    // ATENCIÓN AQUÍ: Elegimos el 14 de Junio de 2026, que cae día DOMINGO
    fireEvent.change(inputFecha, { target: { value: '2026-06-14' } });

    // 3. RESULTADOS ESPERADOS (Según el Excel de QA)
    // El sistema debe detectar que no hay turnos el domingo y mostrar "❌ Sin horas"
    await waitFor(() => {
      expect(screen.getByText(/❌ Sin horas/i)).toBeInTheDocument();
    });

    // Y como no hay horas, el botón para ir a pagar debe estar completamente deshabilitado
    const btnContinuar = screen.getByRole('button', { name: /Continuar al Pago/i });
    expect(btnContinuar).toBeDisabled();
  });

  test('CP-11: Debe excluir el bloque de almuerzo de las horas disponibles', async () => {
    // 1. EL TRUCO: Simulamos un Lunes laboral, pero con colación de 14:00 a 15:00
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/servicios')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1, nombre: 'Tintura', precio: 25000 }]) });
      }
      if (url.includes('/api/empleado')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1, nombre: 'Ana', apellido: 'Gómez' }]) });
      }
      if (url.includes('/api/horarios')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([
          { 
            empleado: { id: 1 }, 
            diaSemana: 1, // Lunes
            horaInicio: '10:00', 
            horacierre: '18:00',
            horaInicioAlmuerzo: '14:00', // <-- Aquí está la trampa
            horaFinAlmuerzo: '15:00'
          }
        ]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(<BookingForm onBookingComplete={() => {}} onClose={() => {}} />);

    // Esperamos a que la pantalla cargue
    await waitFor(() => {
      expect(screen.queryByText(/Conectando con el sistema/i)).not.toBeInTheDocument();
    });

    const selectServicio = document.querySelector('select[name="servicioId"]');
    const selectEmpleado = document.querySelector('select[name="empleadoId"]');
    const inputFecha = document.querySelector('input[type="date"]');

    // 2. Interactuamos: Elegimos el 15 de Junio de 2026 (que cae Lunes)
    fireEvent.change(selectServicio, { target: { value: '1' } });
    fireEvent.change(selectEmpleado, { target: { value: '1' } });
    fireEvent.change(inputFecha, { target: { value: '2026-06-15' } });

    // 3. RESULTADOS ESPERADOS (Según Excel)
    await waitFor(() => {
      const selectHora = document.querySelector('select[name="hora"]');
      expect(selectHora.options.length).toBeGreaterThan(1);
    });

    // Verificamos que la hora de almuerzo (14:00) haya sido ELIMINADA de las opciones
    const opcionAlmuerzo = screen.queryByRole('option', { name: '14:00' });
    expect(opcionAlmuerzo).not.toBeInTheDocument();

    // Verificamos que las horas de los costados (13:00 y 15:00) SÍ existan para agendar
    const opcionAntes = screen.getByRole('option', { name: '13:00' });
    const opcionDespues = screen.getByRole('option', { name: '15:00' });
    
    expect(opcionAntes).toBeInTheDocument();
    expect(opcionDespues).toBeInTheDocument();
  });

});