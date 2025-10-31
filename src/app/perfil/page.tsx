'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Mail, Shield, Users } from 'lucide-react';
import Footer from '@/components/Footer';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  grupo: number;
  createdAt?: string;
}

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('No autorizado');
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Error de autenticación:', error);
        localStorage.removeItem('token');
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
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar todo
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Limpiar cookies manualmente
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Redirigir con recarga completa
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--color-button)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-text-medium)]">Cargando...</p>
        </div>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      student: { text: 'Estudiante', color: 'bg-[var(--color-section)] text-[var(--color-text-light)]' },
      teacher: { text: 'Profesor', color: 'bg-[var(--color-button)] text-[var(--color-text-light)]' },
      admin: { text: 'Administrador', color: 'bg-[var(--color-header)] text-[var(--color-text-light)]' },
    };
    return badges[role as keyof typeof badges] || badges.student;
  };

  const getGrupoBadge = (grupo: number) => {
    if (grupo === 0) return { text: 'Admin/Profesor', color: 'bg-gray-500 text-white' };
    return { text: `Grupo ${grupo}`, color: grupo === 1 ? 'bg-blue-500 text-white' : 'bg-green-500 text-white' };
  };

  const roleBadge = getRoleBadge(user?.role || 'student');
  const grupoBadge = getGrupoBadge(user?.grupo || 0);

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      {/* Header */}
      <header className="bg-[var(--color-header)] text-[var(--color-text-light)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="hover:underline font-medium"
          >
            ← Volver al curso
          </button>
          <h1 className="text-2xl font-bold">Mi Perfil</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-button)] hover:opacity-90 transition"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="bg-[var(--color-section)] text-[var(--color-text-light)] rounded-3xl shadow-lg p-8">

          {/* Perfil */}
          <div className="mb-8 flex items-center gap-4">
            <div className="w-16 h-16 bg-[var(--color-button)] rounded-2xl flex items-center justify-center shadow-md">
              <User className="w-8 h-8 text-[var(--color-text-light)]" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">{user?.name}</h2>
              <div className="flex gap-2 mt-2">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${roleBadge.color}`}>
                  {roleBadge.text}
                </span>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${grupoBadge.color}`}>
                  {grupoBadge.text}
                </span>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="bg-[var(--color-background)] text-[var(--color-text-dark)] rounded-2xl p-6 shadow-inner border border-[var(--color-button)] mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[var(--color-button)] rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-[var(--color-text-light)]" />
              </div>
              <h3 className="text-lg font-semibold">Email</h3>
            </div>
            <p className="font-medium">{user?.email}</p>
          </div>

          {/* Rol */}
          <div className="bg-[var(--color-background)] text-[var(--color-text-dark)] rounded-2xl p-6 shadow-inner border border-[var(--color-button)] mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[var(--color-button)] rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-[var(--color-text-light)]" />
              </div>
              <h3 className="text-lg font-semibold">Rol</h3>
            </div>
            <p className="font-medium">{roleBadge.text}</p>
          </div>

          {/* Grupo (solo para estudiantes) */}
          {user?.role === 'student' && (
            <div className="bg-[var(--color-background)] text-[var(--color-text-dark)] rounded-2xl p-6 shadow-inner border border-[var(--color-button)] mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[var(--color-button)] rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-[var(--color-text-light)]" />
                </div>
                <h3 className="text-lg font-semibold">Grupo</h3>
              </div>
              <p className="font-medium">{grupoBadge.text}</p>
            </div>
          )}

          {/* Zona para administrador */}
          {user?.role === 'admin' && (
            <>
              {/* Subir CSV */}
              <div className="mt-12 bg-[var(--color-background)] text-[var(--color-text-dark)] rounded-3xl shadow-lg border border-[var(--color-section)] p-8">
                <h3 className="text-2xl font-bold mb-4 text-[var(--color-header)]">
                  📤 Subir lista de estudiantes (CSV)
                </h3>
                <p className="text-[var(--color-text-medium)] mb-2">
                  Sube un archivo CSV con las columnas en el siguiente orden:
                </p>
                <div className="bg-gray-100 p-3 rounded-lg mb-4 font-mono text-sm">
                  <strong>No, Apellidos, Nombre, Documento, Correo, Grupo</strong>
                </div>
                <ul className="text-[var(--color-text-medium)] text-sm mb-6 list-disc list-inside space-y-1">
                  <li>Cada estudiante se creará con su número de documento como contraseña</li>
                  <li><strong className="text-red-600">El campo Grupo es OBLIGATORIO y debe ser 1 o 2</strong></li>
                  <li>El Grupo debe ser la última columna del CSV</li>
                </ul>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const fileInput = (e.target as HTMLFormElement).elements.namedItem('csv') as HTMLInputElement;
                    const file = fileInput.files?.[0];
                    if (!file) return alert('Por favor selecciona un archivo CSV.');

                    const formData = new FormData();
                    formData.append('file', file);

                    try {
                      const token = localStorage.getItem('token');
                      const res = await fetch('/api/admin/upload-csv', {
                        method: 'POST',
                        body: formData,
                        headers: { Authorization: `Bearer ${token}` },
                      });

                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Error al subir CSV');
                      
                      // Mostrar resultado detallado
                      let message = `✅ ${data.message}\n`;
                      if (data.errors && data.errors.length > 0) {
                        message += `\n⚠️ Errores encontrados:\n${data.errors.join('\n')}`;
                      }
                      alert(message);
                      
                      // Limpiar el input
                      fileInput.value = '';
                    } catch (err: any) {
                      console.error(err);
                      alert(`❌ Error procesando el archivo:\n${err.message}`);
                    }
                  }}
                >
                  <input
                    type="file"
                    name="csv"
                    accept=".csv"
                    className="block w-full mb-4 border border-[var(--color-button)] rounded-lg p-2"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[var(--color-button)] text-[var(--color-text-light)] rounded-lg font-semibold hover:opacity-90"
                  >
                    Subir y procesar CSV
                  </button>
                </form>
                
                <div className="mt-4 text-xs text-[var(--color-text-medium)]">
                  <strong>Ejemplo de formato CSV:</strong>
                  <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
{`No,Apellidos,Nombre,Documento,Correo,Grupo
1,García,Juan,123456,juan@email.com,1
2,López,María,789012,maria@email.com,2`}
                  </pre>
                </div>
              </div>

              {/* Lista de usuarios */}
              <div className="mt-12 bg-[var(--color-background)] text-[var(--color-text-dark)] rounded-3xl shadow-lg border border-[var(--color-section)] p-8">
                <h3 className="text-2xl font-bold mb-4 text-[var(--color-header)]">
                  👥 Usuarios registrados
                </h3>
                <p className="text-[var(--color-text-medium)] mb-6">
                  Visualizar y eliminar usuarios
                </p>

                <button
                  onClick={async () => {
                    const token = localStorage.getItem('token');
                    const res = await fetch('/api/admin/list-users', {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setUsers(data.users);
                    } else {
                      alert('Error al cargar usuarios');
                    }
                  }}
                  className="px-4 py-2 bg-[var(--color-button)] text-[var(--color-text-light)] rounded-lg font-semibold hover:opacity-90 mb-6"
                >
                  🔄 Cargar lista de usuarios
                </button>

                {users && users.length > 0 ? (
                  <ul className="divide-y divide-[var(--color-section)]">
                    {users.map((u) => {
                      const userGrupoBadge = getGrupoBadge(u.grupo || 0);
                      return (
                        <li key={u.id} className="py-3 flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{u.name || '(Sin nombre)'}</p>
                            <p className="text-sm text-[var(--color-text-medium)]">{u.email}</p>
                            <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${userGrupoBadge.color}`}>
                              {userGrupoBadge.text}
                            </span>
                          </div>
                          <button
                            onClick={async () => {
                              const token = localStorage.getItem('token');
                              if (!confirm(`¿Eliminar usuario ${u.email}?`)) return;

                              const res = await fetch(`/api/admin/delete-user?id=${u.id}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` },
                              });

                              if (res.ok) {
                                alert('✅ Usuario eliminado');
                                setUsers((prev) => prev.filter((x) => x.id !== u.id));
                              } else {
                                alert('❌ Error al eliminar');
                              }
                            }}
                            className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md"
                          >
                            Eliminar
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-[var(--color-text-medium)]">No hay usuarios cargados.</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}