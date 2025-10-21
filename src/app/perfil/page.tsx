'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Mail, Calendar, Loader2, Shield } from 'lucide-react';
import Footer from '@/components/Footer';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
}

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('No hay token, redirigiendo a login');
          router.push('/login');
          return;
        }

        console.log('Verificando sesión...');
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          console.error('Respuesta no OK:', response.status);
          throw new Error('No autorizado');
        }

        const data = await response.json();
        console.log('Usuario autenticado:', data.user);
        setUser(data.user);
      } catch (error) {
        console.error('Error de autenticación:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include' 
      });
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
      router.refresh(); 
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      student: { text: 'Estudiante', color: 'bg-blue-100 text-blue-800' },
      teacher: { text: 'Profesor', color: 'bg-purple-100 text-purple-800' },
      admin: { text: 'Administrador', color: 'bg-red-100 text-red-800' }
    };
    return badges[role as keyof typeof badges] || badges.student;
  };

  const roleBadge = getRoleBadge(user?.role || 'student');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="text-indigo-600 hover:text-indigo-700 font-medium transition"
            >
              ← Volver al curso
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              Mi Perfil
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  {user?.name}
                </h2>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${roleBadge.color}`}>
                  {roleBadge.text}
                </span>
              </div>
            </div>
          </div>

          {/* User Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Email
                </h3>
              </div>
              <p className="text-gray-700 font-medium">
                {user?.email}
              </p>
            </div>

            {/* Role Card */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Rol
                </h3>
              </div>
              <p className="text-gray-700 font-medium">
                {roleBadge.text}
              </p>
            </div>

            {/* User ID Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  ID de Usuario
                </h3>
              </div>
              <p className="text-gray-700 font-mono text-sm break-all">
                {user?.id}
              </p>
            </div>

            {/* Created At Card */}
            {user?.createdAt && (
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Miembro desde
                  </h3>
                </div>
                <p className="text-gray-700 font-medium">
                  {new Date(user.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Success Message */}
          <div className="mt-8 p-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl text-white">
            <h3 className="text-xl font-bold mb-2">
              🎓 Bienvenido al Curso de Modelos Estocásticos
            </h3>
            <p className="text-indigo-100">
              Tu cuenta está activa y puedes acceder a todo el contenido del curso.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}