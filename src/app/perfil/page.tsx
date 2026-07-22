'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Mail, Shield, Upload, Trash2, Eye, Settings, ChevronDown, ChevronRight, Plus, Moon, Sun } from 'lucide-react';
import Footer from '@/components/Footer';
import { useToast } from '@/components/Toast';

interface UserData {
  id: string; email: string; name: string; role: string; grupo: number;
}

interface Topic {
  id: string; slug: string; title: string; parte: string | null; parentSlug: string | null;
  visibleGroup1: boolean; visibleGroup2: boolean; order: number;
}

type AdminTab = 'upload' | 'users' | 'topics';

export default function PerfilPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>('topics');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [openPartes, setOpenPartes] = useState<string[]>([]);
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicSlug, setNewTopicSlug] = useState('');
  const [newTopicParte, setNewTopicParte] = useState('');
  const [newTopicParent, setNewTopicParent] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    setDarkMode(savedTheme === 'dark');
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }
        const response = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error('No autorizado');
        const data = await response.json();
        setUser(data.user);
      } catch {
        localStorage.removeItem('token');
        router.push('/login');
      } finally { setLoading(false); }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      window.location.href = '/';
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/list-users', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setUsers(data.users);
      else toast('Error al cargar usuarios', 'error');
    } catch { toast('Error al cargar usuarios', 'error'); }
    finally { setLoadingUsers(false); }
  };

  const loadTopics = async () => {
    setLoadingTopics(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/topics', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setTopics(data.topics);
      else toast('Error al cargar temas', 'error');
    } catch { toast('Error al cargar temas', 'error'); }
    finally { setLoadingTopics(false); }
  };

  const syncTopics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/topics/sync', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) { toast(data.message, 'success'); loadTopics(); }
      else toast('Error sincronizando', 'error');
    } catch { toast('Error sincronizando', 'error'); }
  };

  const toggleTopicVisibility = async (topicId: string, group: number, currentVisible: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/topics', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, group, visible: !currentVisible })
      });
      if (res.ok) {
        setTopics(prev => prev.map(t => {
          if (t.id === topicId) {
            return group === 1 ? { ...t, visibleGroup1: !currentVisible } : { ...t, visibleGroup2: !currentVisible };
          }
          return t;
        }));
      } else { toast('Error actualizando visibilidad', 'error'); }
    } catch { toast('Error actualizando visibilidad', 'error'); }
  };

  const generarSlug = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ñ/g, "n").replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle || !newTopicSlug) return toast('Título y slug son requeridos', 'warning');
    setCreatingTopic(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/topics/create', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTopicTitle, slug: newTopicSlug, parte: newTopicParte || null, parentSlug: newTopicParent || null })
      });
      const data = await res.json();
      if (res.ok) {
        toast('Tema creado exitosamente', 'success');
        setNewTopicTitle(''); setNewTopicSlug(''); setNewTopicParte(''); setNewTopicParent('');
        setShowCreateTopic(false);
        loadTopics();
      } else toast(data.error, 'error');
    } catch { toast('Error al crear el tema', 'error'); }
    finally { setCreatingTopic(false); }
  };

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) loadUsers();
    if (activeTab === 'topics' && topics.length === 0) loadTopics();
  }, [activeTab]);

  const toggleParte = (p: string) => setOpenPartes(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
        <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // Group topics by parte for the cascading view
  const partes = [...new Set(topics.map(t => t.parte || 'Sin categoría'))];
  const getTopicsByParte = (parte: string) => topics.filter(t => (t.parte || 'Sin categoría') === parte && !t.parentSlug);
  const getChildren = (parentSlug: string) => topics.filter(t => t.parentSlug === parentSlug);

  const getRoleBadge = (role: string) => {
    const b: Record<string, {text: string; bg: string}> = {
      student: { text: 'Estudiante', bg: 'var(--color-section)' },
      teacher: { text: 'Profesor', bg: 'var(--color-accent)' },
      admin: { text: 'Administrador', bg: 'var(--color-header)' },
    };
    return b[role] || b.student;
  };

  const roleBadge = getRoleBadge(user?.role || 'student');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <header className="shadow-sm border-b" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-sm hover:underline" style={{ color: 'var(--color-text-medium)' }}>← Volver</button>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-header)' }}>Perfil</h1>
          <div className="flex gap-2">
            <button onClick={toggleDarkMode} className="btn btn-ghost p-2">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={handleLogout} className="btn btn-primary text-sm">
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-5xl mx-auto px-6 py-8 w-full">
        {/* User info */}
        <div className="card p-6 mb-6 animate-fadeIn">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--color-accent-soft)' }}>
              <User className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-dark)' }}>{user?.name}</h2>
              <div className="flex gap-2 mt-1">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white" style={{ background: roleBadge.bg }}>{roleBadge.text}</span>
                {user?.grupo ? <span className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white" style={{ background: user.grupo === 1 ? '#3b82f6' : '#22c55e' }}>Grupo {user.grupo}</span> : null}
              </div>
            </div>
          </div>
          <div className="text-sm flex items-center gap-2" style={{ color: 'var(--color-text-medium)' }}>
            <Mail className="w-4 h-4" /> {user?.email}
          </div>
        </div>

        {/* Admin panel */}
        {user?.role === 'admin' && (
          <div className="card p-6 animate-fadeIn">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-header)' }}>Panel de Administración</h2>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              {([['upload', Upload, 'Cargar CSV'], ['users', Trash2, 'Usuarios'], ['topics', Eye, 'Visibilidad']] as const).map(([key, Icon, label]) => (
                <button key={key} onClick={() => setActiveTab(key as AdminTab)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition border-b-2 ${
                    activeTab === key ? 'border-current' : 'border-transparent'
                  }`}
                  style={{ color: activeTab === key ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            {/* Upload CSV */}
            {activeTab === 'upload' && (
              <div>
                <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-dark)' }}>Subir lista de estudiantes (CSV)</h3>
                <div className="p-3 rounded text-xs font-mono mb-4 border" style={{ background: 'var(--color-accent-soft)', borderColor: 'var(--color-border)' }}>
                  No, Apellidos, Nombre, Documento, Correo, Grupo
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const fileInput = (e.target as HTMLFormElement).elements.namedItem('csv') as HTMLInputElement;
                  const file = fileInput.files?.[0];
                  if (!file) return toast('Selecciona un archivo CSV', 'warning');
                  const formData = new FormData();
                  formData.append('file', file);
                  try {
                    const token = localStorage.getItem('token');
                    const res = await fetch('/api/admin/upload-csv', { method: 'POST', body: formData, headers: { Authorization: `Bearer ${token}` } });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    toast(data.message, 'success');
                    if (data.errors?.length > 0) toast(`${data.errors.length} errores encontrados`, 'warning');
                    fileInput.value = '';
                  } catch (err: any) { toast(err.message, 'error'); }
                }}>
                  <input type="file" name="csv" accept=".csv" className="block w-full text-sm mb-4 border rounded-lg p-2" style={{ borderColor: 'var(--color-border)' }} />
                  <button type="submit" className="btn btn-primary">Procesar CSV</button>
                </form>
              </div>
            )}

            {/* Users */}
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-dark)' }}>Gestionar Usuarios</h3>
                  <button onClick={loadUsers} disabled={loadingUsers} className="btn btn-primary text-sm disabled:opacity-50">
                    {loadingUsers ? 'Cargando...' : 'Actualizar'}
                  </button>
                </div>
                {users.length > 0 ? (
                  <div className="space-y-2">
                    {users.map(u => (
                      <div key={u.id} className="flex justify-between items-center p-3 rounded-lg border transition hover:shadow-sm"
                        style={{ background: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                        <div>
                          <p className="font-medium text-sm">{u.name || '(Sin nombre)'}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{u.email}</p>
                        </div>
                        <button onClick={async () => {
                          if (!confirm(`¿Eliminar usuario ${u.email}?`)) return;
                          const token = localStorage.getItem('token');
                          const res = await fetch(`/api/admin/delete-user?id=${u.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                          if (res.ok) { toast('Usuario eliminado', 'success'); setUsers(prev => prev.filter(x => x.id !== u.id)); }
                          else toast('Error al eliminar', 'error');
                        }} className="btn text-sm" style={{ background: 'var(--color-error)', color: 'white' }}>
                          <Trash2 className="w-3 h-3" /> Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>Haz clic en "Actualizar"</p>}
              </div>
            )}

            {/* Topics visibility */}
            {activeTab === 'topics' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-dark)' }}>Visibilidad por Grupos</h3>
                  <div className="flex gap-2">
                    <button onClick={syncTopics} className="btn text-sm" style={{ background: 'var(--color-success)', color: 'white' }}>
                      <Settings className="w-3 h-3" /> Sincronizar
                    </button>
                    <button onClick={loadTopics} disabled={loadingTopics} className="btn btn-primary text-sm disabled:opacity-50">
                      {loadingTopics ? '...' : 'Actualizar'}
                    </button>
                  </div>
                </div>

                {/* Legend + Create button */}
                <div className="mb-4 flex justify-between items-center">
                  <div className="flex gap-4 p-2 rounded-lg text-xs border" style={{ background: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Grupo 1</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> Grupo 2</div>
                  </div>
                  <button onClick={() => setShowCreateTopic(!showCreateTopic)} className="btn text-sm" style={{ background: 'var(--color-accent)', color: 'white' }}>
                    {showCreateTopic ? 'Cancelar' : '+ Crear Tema'}
                  </button>
                </div>

                {/* Create form */}
                {showCreateTopic && (
                  <div className="mb-6 p-4 border rounded-lg" style={{ borderColor: 'var(--color-accent)', background: 'var(--color-accent-soft)' }}>
                    <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-header)' }}>Crear Nuevo Tema</h4>
                    <form onSubmit={handleCreateTopic} className="space-y-3">
                      <input type="text" className="w-full p-2 border rounded text-sm" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                        value={newTopicTitle} onChange={e => { setNewTopicTitle(e.target.value); setNewTopicSlug(generarSlug(e.target.value)); }}
                        placeholder="Título del tema" required />
                      <input type="text" className="w-full p-2 border rounded text-sm" style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)' }}
                        value={newTopicSlug} onChange={e => setNewTopicSlug(e.target.value)} placeholder="slug-del-tema" required />
                      <select className="w-full p-2 border rounded text-sm" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                        value={newTopicParte} onChange={e => setNewTopicParte(e.target.value)}>
                        <option value="">-- Seleccionar Parte (opcional) --</option>
                        {partes.map(p => <option key={p} value={p}>{p}</option>)}
                        <option value="__new__">+ Nueva parte...</option>
                      </select>
                      {newTopicParte === '__new__' && (
                        <input type="text" className="w-full p-2 border rounded text-sm" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                          onChange={e => setNewTopicParte(e.target.value)} placeholder="Nombre de la nueva parte" />
                      )}
                      <select className="w-full p-2 border rounded text-sm" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                        value={newTopicParent} onChange={e => setNewTopicParent(e.target.value)}>
                        <option value="">-- Tema padre (opcional, para subtemas) --</option>
                        {topics.filter(t => !t.parentSlug).map(t => <option key={t.slug} value={t.slug}>{t.title}</option>)}
                      </select>
                      <button type="submit" disabled={creatingTopic} className="btn btn-primary disabled:opacity-50">
                        {creatingTopic ? 'Guardando...' : 'Guardar Tema'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Topics by parte */}
                {topics.length > 0 ? (
                  <div className="space-y-2">
                    {partes.map(parte => (
                      <div key={parte} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                        <button onClick={() => toggleParte(parte)}
                          className="flex w-full items-center justify-between p-3 transition text-left"
                          style={{ background: 'var(--color-background)' }}>
                          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-dark)' }}>{parte}</span>
                          {openPartes.includes(parte) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        {openPartes.includes(parte) && (
                          <div style={{ background: 'var(--color-surface)' }}>
                            {getTopicsByParte(parte).map(topic => {
                              const children = getChildren(topic.slug);
                              return (
                                <div key={topic.id} className="border-t" style={{ borderColor: 'var(--color-border-soft)' }}>
                                  <TopicRow topic={topic} onToggle={toggleTopicVisibility} />
                                  {children.map(child => (
                                    <div key={child.id} className="pl-6 border-t" style={{ borderColor: 'var(--color-border-soft)' }}>
                                      <TopicRow topic={child} onToggle={toggleTopicVisibility} small />
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>Haz clic en "Sincronizar"</p>}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function TopicRow({ topic, onToggle, small }: { topic: Topic; onToggle: (id: string, g: number, v: boolean) => void; small?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 hover:opacity-90 transition">
      <span className={`flex-1 ${small ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--color-text-dark)' }}>{topic.title}</span>
      <div className="flex gap-2 items-center">
        <a href={`/perfil/tema/${topic.id}`}
          className="px-2 py-1 rounded text-xs transition" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
          Contenido
        </a>
        <button onClick={() => onToggle(topic.id, 1, topic.visibleGroup1)}
          className={`px-3 py-1 rounded text-xs font-medium transition ${topic.visibleGroup1 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}`}>G1</button>
        <button onClick={() => onToggle(topic.id, 2, topic.visibleGroup2)}
          className={`px-3 py-1 rounded text-xs font-medium transition ${topic.visibleGroup2 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>G2</button>
      </div>
    </div>
  );
}