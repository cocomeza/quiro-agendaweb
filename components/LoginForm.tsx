'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDebugInfo(null);
    setSuccess(false);
    
    // Validación básica
    if (!email.trim()) {
      setError('Por favor ingresa tu email');
      return;
    }
    
    if (!password.trim()) {
      setError('Por favor ingresa tu contraseña');
      return;
    }

    setLoading(true);

    try {
      // Usar la ruta API que maneja el login en el servidor
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // IMPORTANTE: incluir cookies
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // El mensaje de error ya viene formateado desde el servidor
        const errorMessage = result.error || 'Error al iniciar sesión. Intenta nuevamente.';
        setError(errorMessage);
        
        // En desarrollo, mostrar información adicional de depuración
        if (process.env.NODE_ENV === 'development') {
          console.error('[LoginForm] Error de login:', {
            status: response.status,
            error: result.error,
            response: result,
          });
        }
        
        setLoading(false);
        return;
      }

      if (!result.success) {
        setError('No se pudo crear la sesión. Intenta nuevamente.');
        setLoading(false);
        return;
      }

      // Login exitoso - las cookies ya están establecidas por la API route
      // Logger removido - no loggear información sensible
      
      setLoading(false);
      setSuccess(true);
      
      // Redirigir inmediatamente - las cookies ya están establecidas en el servidor
      window.location.href = '/';
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      // Logger removido - el error ya se muestra al usuario
      const mensajeError = error.message.toLowerCase();
      if (mensajeError.includes('fetch') || mensajeError.includes('network') || mensajeError.includes('conexión')) {
        setError('Error de conexión. Verifica tu internet e intenta nuevamente.');
      } else if (mensajeError.includes('timeout')) {
        setError('La operación tardó demasiado. Intenta nuevamente.');
      } else {
        setError(error.message || 'Error inesperado al iniciar sesión. Intenta nuevamente.');
      }
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-md shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {debugInfo && (
        <div className={`border-2 px-4 py-3 rounded-md shadow-lg ${success ? 'bg-green-50 border-green-400 text-green-900' : 'bg-blue-50 border-blue-300 text-blue-800'}`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {success ? (
                <svg className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-mono whitespace-pre-wrap leading-relaxed">{debugInfo}</p>
              {success && (
                <button
                  onClick={() => window.location.href = '/'}
                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm font-medium"
                >
                  Ir al Panel Ahora
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </div>
    </form>
  );
}

