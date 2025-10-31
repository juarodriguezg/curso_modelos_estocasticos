'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Verificar si ya hay sesión activa
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.ok) {
            // Ya hay sesión válida, redirigir
            console.log('Sesión activa detectada, redirigiendo...');
            router.push('/');
            return;
          }
        } catch (err) {
          console.error('Error verificando sesión:', err);
        }
      }
      
      setChecking(false);
    };

    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la operación');
      }

      // Guardar token y usuario
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('Login exitoso, redirigiendo...');
      
      // Redirigir al home
      window.location.href = '/';

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Mostrar loading mientras verifica sesión
  if (checking) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--color-button)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: 'var(--color-text-medium)' }}>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div 
        className="rounded-3xl shadow-2xl w-full max-w-md p-8 border"
        style={{ 
          backgroundColor: 'white',
          borderColor: 'var(--color-section)'
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ backgroundColor: 'var(--color-header)' }}
          >
            <Lock className="w-8 h-8" style={{ color: 'var(--color-text-light)' }} />
          </div>
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--color-header)' }}
          >
            Bienvenido
          </h1>
          <p style={{ color: 'var(--color-text-medium)' }}>
            Curso de Modelos Estocásticos
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div 
            className="mb-6 p-4 border-l-4 rounded-r-lg flex items-start gap-3"
            style={{ 
              backgroundColor: '#fee',
              borderColor: '#f66'
            }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#c33' }} />
            <p className="text-sm" style={{ color: '#c33' }}>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label 
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--color-text-dark)' }}
            >
              Email
            </label>
            <div className="relative">
              <Mail 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: 'var(--color-text-medium)' }}
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 border rounded-xl transition-all outline-none"
                style={{
                  borderColor: 'var(--color-section)',
                  color: 'var(--color-text-dark)'
                }}
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label 
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--color-text-dark)' }}
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: 'var(--color-text-medium)' }}
              />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 border rounded-xl transition-all outline-none"
                style={{
                  borderColor: 'var(--color-section)',
                  color: 'var(--color-text-dark)'
                }}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            style={{
              backgroundColor: 'var(--color-button)',
              color: 'var(--color-text-light)'
            }}
          >
            {loading ? (
              <span>Procesando...</span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        {/* Volver al inicio */}
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm transition-colors hover:underline"
            style={{ color: 'var(--color-text-medium)' }}
          >
            ← Volver al curso
          </button>
        </div>
      </div>
    </div>
  );
}