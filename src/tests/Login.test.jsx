
import React from 'react';
import { describe, test, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';

import Login from '../Pages/Login.jsx'; 

afterEach(() => {
  cleanup();
  localStorage.clear(); 
  vi.restoreAllMocks(); 
});

describe('Pruebas Funcionales - Login (Basado en CP-01)', () => {

  test('CP-01: Debe validar correctamente el Login de un Admin y guardar su rol', async () => {
    
    // 1. Interceptamos la red y fingimos que el backend de Spring Boot respondió perfecto
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          id_usuario: 1, 
          nombre: 'Eugenio Admin', 
          rol: 'admin' 
        }),
      })
    );

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // 2. Llenamos los datos (no importa si existen en MySQL porque estamos simulando el OK)
    fireEvent.change(screen.getByPlaceholderText(/tu@email.com/i), { target: { value: 'admin@peluqueria.cl' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'Admin2026*' } });

    // 3. Forzamos el clic
    const btnLogin = screen.getByRole('button');
    fireEvent.submit(btnLogin.closest('form'));

    // 4. Verificamos que guardó el rol correctamente
    await waitFor(() => {
      expect(localStorage.getItem('isAuthenticated')).toBe('true');
    });

    expect(localStorage.getItem('userRole')).toBe('admin');
    expect(localStorage.getItem('userName')).toBe('Eugenio Admin');
  });
  
  test('CP-01 Parte 2: Debe validar el Login de un Cliente y guardar su rol correctamente', async () => {
    
    // 1. Interceptamos la red, pero esta vez fingimos que el backend respondió con rol 'cliente'
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          id_usuario: 2, 
          nombre: 'Juan Cliente', 
          rol: 'cliente' 
        }),
      })
    );

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // 2. Llenamos los datos usando los correos que salen en el Excel del QA
    fireEvent.change(screen.getByPlaceholderText(/tu@email.com/i), { target: { value: 'cliente@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'Cliente123*' } });

    // 3. Forzamos el clic
    const btnLogin = screen.getByRole('button');
    fireEvent.submit(btnLogin.closest('form'));

    // 4. Verificamos que guardó el rol como 'cliente' y no como 'admin'
    await waitFor(() => {
      expect(localStorage.getItem('isAuthenticated')).toBe('true');
    });

    expect(localStorage.getItem('userRole')).toBe('cliente');
    expect(localStorage.getItem('userName')).toBe('Juan Cliente');
  });
});