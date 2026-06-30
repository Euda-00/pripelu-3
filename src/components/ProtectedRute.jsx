import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  // 1. Buscamos el valor en el LocalStorage
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  // LOG DE DEBUG: Esto te dirá en la consola qué está pasando
  console.log("¿Está autenticado?:", isAuthenticated);

  if (!isAuthenticated) {
    // 2. Si es falso, lo mandamos de patitas a la calle (al login)
    return <Navigate to="/login" replace />;
  }

  // 3. Si es verdadero, lo dejamos pasar al Dashboard
  return children;
}