'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, AlertCircle, LogIn, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la operación');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      router.push('/');
      
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
            {isLogin ? 'Bienvenido' : 'Crear Cuenta'}
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
        <div className="space-y-5">
          {!isLogin && (
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--color-text-dark)' }}
              >
                Nombre
              </label>
              <div className="relative">
                <User 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: 'var(--color-text-medium)' }}
                />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border rounded-xl transition-all outline-none"
                  style={{
                    borderColor: 'var(--color-section)',
                    color: 'var(--color-text-dark)'
                  }}
                  placeholder="Tu nombre"
                />
              </div>
            </div>
          )}

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
              />
            </div>
            {!isLogin && (
              <p 
                className="mt-2 text-xs flex items-center gap-1"
                style={{ color: 'var(--color-text-medium)' }}
              >
                <span style={{ color: 'var(--color-header)' }}>•</span> Mínimo 6 caracteres
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
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
                {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
              </>
            )}
          </button>
        </div>

        {/* Toggle Login/Register */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="font-medium transition-colors text-sm hover:underline"
            style={{ color: 'var(--color-header)' }}
          >
            {isLogin 
              ? '¿No tienes cuenta? Regístrate aquí' 
              : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>

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