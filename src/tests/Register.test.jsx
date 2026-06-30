import React from 'react';
import { describe, test, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';

// Ajusta la ruta a tu carpeta correspondiente
import Register from '../Pages/Register.jsx'; 

afterEach(() => {
  cleanup();
});

describe('Pruebas Funcionales - Formulario de Registro (Plan QA)', () => {

  // --- LOS QUE YA TENÍAMOS ---
  test('CP-20: Debe bloquear el envío si los campos obligatorios están vacíos', async () => {
    render(<MemoryRouter><Register /></MemoryRouter>);
    const btnRegistrar = screen.getByRole('button', { name: /Registrarse/i });
    fireEvent.submit(btnRegistrar.closest('form'));
    const mensajeError = await screen.findByText(/Por favor, rellena todos los campos obligatorios/i);
    expect(mensajeError).toBeInTheDocument();
  });

  test('CP-18: Debe rebotar el formulario si el correo es inválido', async () => {
    render(<MemoryRouter><Register /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText(/Tu nombre/i), { target: { value: 'Tomas' } });
    fireEvent.change(screen.getByPlaceholderText(/Tu apellido/i), { target: { value: 'Heise' } });
    fireEvent.change(screen.getByPlaceholderText(/\+56912345678/i), { target: { value: '+56912345678' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'secreta123' } });
    fireEvent.change(screen.getByPlaceholderText(/tu@email.com/i), { target: { value: 'correo_malo_sin_formato' } });

    const btnRegistrar = screen.getByRole('button', { name: /Registrarse/i });
    fireEvent.submit(btnRegistrar.closest('form'));
    const mensajeError = await screen.findByText(/correo electrónico válido/i);
    expect(mensajeError).toBeInTheDocument();
  });

  // --- LOS CASOS NUEVOS ---
  
  test('CP-16 y CP-17: Debe bloquear si el Nombre o Apellido contienen números o símbolos', async () => {
    render(<MemoryRouter><Register /></MemoryRouter>);

    // 1. Llenamos con un nombre y apellido malos a propósito (con números y símbolos)
    fireEvent.change(screen.getByPlaceholderText(/Tu nombre/i), { target: { value: 'Tomas123' } });
    fireEvent.change(screen.getByPlaceholderText(/Tu apellido/i), { target: { value: 'Heise!' } });
    
    // 2. Datos buenos para el resto
    fireEvent.change(screen.getByPlaceholderText(/\+56912345678/i), { target: { value: '+56912345678' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'secreta123' } });
    fireEvent.change(screen.getByPlaceholderText(/tu@email.com/i), { target: { value: 'tomas@gmail.com' } });

    // 3. Forzamos el envío
    const btnRegistrar = screen.getByRole('button', { name: /Registrarse/i });
    fireEvent.submit(btnRegistrar.closest('form'));

    // 4. Verificamos que salte la validación de tu RegEx
    const mensajeError = await screen.findByText(/solo deben contener letras/i);
    expect(mensajeError).toBeInTheDocument();
  });

  test('CP-19: Debe exigir el formato de teléfono móvil válido', async () => {
    render(<MemoryRouter><Register /></MemoryRouter>);

    // 1. Datos buenos generales
    fireEvent.change(screen.getByPlaceholderText(/Tu nombre/i), { target: { value: 'Tomas' } });
    fireEvent.change(screen.getByPlaceholderText(/Tu apellido/i), { target: { value: 'Heise' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'secreta123' } });
    fireEvent.change(screen.getByPlaceholderText(/tu@email.com/i), { target: { value: 'tomas@gmail.com' } });

    // 2. Teléfono malo (muy corto, sin el +56 o con letras)
    fireEvent.change(screen.getByPlaceholderText(/\+56912345678/i), { target: { value: 'abcd123' } });

    // 3. Forzamos el envío
    const btnRegistrar = screen.getByRole('button', { name: /Registrarse/i });
    fireEvent.submit(btnRegistrar.closest('form'));

    // 4. Verificamos que salte la alerta del teléfono. 
    // (Buscamos la palabra 'teléfono' o 'formato' en el mensaje de error de tu componente)
    const mensajeError = await screen.findByText(/teléfono|formato/i);
    expect(mensajeError).toBeInTheDocument();
  });

});