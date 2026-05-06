'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import Footer from '@/components/Footer';

interface ContentItem {
  type: 'TEXT' | 'VIDEO' | 'MATERIAL';
  content: string;
}

interface LinkItem {
  title: string;
  url: string;
}

export default function EditTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');

        const res = await fetch(`/api/admin/topics/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Error al cargar tema');

        const data = await res.json();
        setTitle(data.topic.title);
        setSlug(data.topic.slug);
        
        // Map fetched contents
        if (data.topic.contents) {
          setContents(data.topic.contents.map((c: any) => ({
            type: c.type,
            content: c.content
          })));
        }

        if (data.topic.links) {
          setLinks(data.topic.links.map((l: any) => ({
            title: l.title,
            url: l.url
          })));
        }
      } catch (error) {
        console.error(error);
        alert('Error cargando el tema');
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [id, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/topics/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, contents, links })
      });

      if (res.ok) {
        alert('✅ Cambios guardados correctamente');
      } else {
        const data = await res.json();
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error guardando los cambios');
    } finally {
      setSaving(false);
    }
  };

  const addContent = (type: 'TEXT' | 'VIDEO' | 'MATERIAL') => {
    setContents([...contents, { type, content: '' }]);
  };

  const removeContent = (index: number) => {
    setContents(contents.filter((_, i) => i !== index));
  };

  const updateContent = (index: number, value: string) => {
    const newContents = [...contents];
    newContents[index].content = value;
    setContents(newContents);
  };

  const addLink = () => {
    setLinks([...links, { title: '', url: '' }]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: 'title' | 'url', value: string) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <p className="text-[var(--color-text-medium)]">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-[var(--color-header)] text-[var(--color-text-light)] shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/perfil')}
            className="flex items-center gap-2 hover:underline text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Perfil
          </button>
          <h1 className="text-xl font-semibold truncate max-w-lg">Editando: {title}</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-[var(--color-button)] hover:opacity-90 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-4xl mx-auto px-6 py-8 w-full space-y-8">
        
        {/* Título */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Información General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título del Tema</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enlace para estudiantes (Slug)</label>
              <input
                type="text"
                value={slug}
                disabled
                className="w-full p-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Los estudiantes acceden a este tema a través de: /temas/{slug}</p>
            </div>
          </div>
        </section>

        {/* Contenidos */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Bloques de Contenido</h2>
            <div className="flex gap-2">
              <button onClick={() => addContent('TEXT')} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Texto
              </button>
              <button onClick={() => addContent('VIDEO')} className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Video
              </button>
              <button onClick={() => addContent('MATERIAL')} className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 flex items-center gap-1">
                <Plus className="w-4 h-4" /> PDF/Material
              </button>
            </div>
          </div>

          {contents.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-500">
              No hay contenidos. Añade un bloque usando los botones de arriba.
            </div>
          ) : (
            <div className="space-y-4">
              {contents.map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="mt-2 text-gray-400 cursor-move">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="flex-grow space-y-2">
                    <div className="flex justify-between">
                      <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${
                        item.type === 'TEXT' ? 'bg-blue-100 text-blue-800' :
                        item.type === 'VIDEO' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    
                    {item.type === 'TEXT' ? (
                      <textarea
                        value={item.content}
                        onChange={(e) => updateContent(index, e.target.value)}
                        placeholder="Escribe el resumen o texto explicativo (soporta HTML básico/JSX o texto plano)..."
                        className="w-full p-3 border border-gray-300 rounded-md h-32 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : item.type === 'VIDEO' ? (
                      <input
                        type="url"
                        value={item.content}
                        onChange={(e) => updateContent(index, e.target.value)}
                        placeholder="URL de YouTube Embed (ej. https://www.youtube.com/embed/...)"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    ) : (
                      <input
                        type="url"
                        value={item.content}
                        onChange={(e) => updateContent(index, e.target.value)}
                        placeholder="URL del PDF o archivo (ej. /documents/archivo.pdf)"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    )}
                  </div>
                  <button
                    onClick={() => removeContent(index)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Links / Tareas */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Tareas y Enlaces (Links)</h2>
            <button onClick={addLink} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Añadir Enlace
            </button>
          </div>

          {links.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-500">
              No hay enlaces añadidos.
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="text-gray-400 cursor-move">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="flex-grow grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => updateLink(index, 'title', e.target.value)}
                      placeholder="Título del enlace (ej. Tarea 4)"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateLink(index, 'url', e.target.value)}
                      placeholder="URL (ej. /documents/tarea4.pdf)"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <button
                    onClick={() => removeLink(index)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
