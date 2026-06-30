import React from 'react';
import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import Servicios from '../components/Servicios.jsx'; 

// Antes de CADA test, ponemos un escudo para que no intente conectarse de verdad
beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    })
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks(); 
});

describe('Pruebas Funcionales - Catálogo de Servicios (Plan QA)', () => {

  test('Debe mostrar el título principal del catálogo', () => {
    render(<Servicios />);
    const titulo = screen.getByText(/Nuestro Catálogo/i);
    expect(titulo).toBeInTheDocument();
  });

  test('Debe mostrar el mensaje de carga inicial', () => {
    // Para esta prueba específica, forzamos que el fetch se demore en responder
    // así el mensaje de "Cargando" se queda pegado en la pantalla y lo podemos leer.
    global.fetch = vi.fn(() => new Promise(() => {}));
    
    render(<Servicios />);
    const mensajeCarga = screen.getByText(/Cargando la magia/i);
    expect(mensajeCarga).toBeInTheDocument();
  });

  test('CP-14: Debe cargar y renderizar los servicios desde el backend correctamente', async () => {
    
    // Aquí sobrescribimos el escudo con los datos falsos que queremos probar
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id_servicio: 1, nombre: 'Corte de Pelo Premium', precio: 15000, descripcion: 'Corte con lavado' },
          { id_servicio: 2, nombre: 'Tintura Fantasía', precio: 35000, descripcion: 'Colores vibrantes' }
        ]),
      })
    );

    render(<Servicios />);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.queryByText(/Cargando la magia/i)).not.toBeInTheDocument();
      
      const servicioUno = screen.getByText(/Corte de Pelo Premium/i);
      const servicioDos = screen.getByText(/Tintura Fantasía/i);
      
      expect(servicioUno).toBeInTheDocument();
      expect(servicioDos).toBeInTheDocument();
    });
  });

});