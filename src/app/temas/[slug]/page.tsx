import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";

export default async function DynamicTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const topic = await prisma.topic.findUnique({
    where: { slug },
    include: {
      contents: { orderBy: { order: 'asc' } },
      links: { orderBy: { order: 'asc' } }
    }
  });

  if (!topic) {
    notFound();
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar />

      <div className="flex flex-col flex-grow">
        <header className="flex justify-between items-center px-8 py-4 shadow-sm border-b"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex-1"></div>
          <h1 className="text-2xl font-bold text-center flex-1" style={{ color: 'var(--color-header)' }}>
            {topic.title}
          </h1>
          <div className="flex-1 text-right">
            <a href="/perfil" className="btn btn-ghost text-sm">Perfil</a>
          </div>
        </header>

        <main className="flex-grow max-w-4xl mx-auto p-8 space-y-8 w-full animate-fadeIn">
          {topic.contents.map((content) => {
            if (content.type === 'TEXT') {
              return (
                <section key={content.id} className="card p-6">
                  <div className="leading-relaxed space-y-4 whitespace-pre-wrap"
                    style={{ color: 'var(--color-text-dark)' }}
                    dangerouslySetInnerHTML={{ __html: content.content }} />
                </section>
              );
            }
            if (content.type === 'VIDEO') {
              return (
                <section key={content.id} className="card p-6">
                  <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-header)' }}>Video</h2>
                  <div className="aspect-video">
                    <iframe className="w-full h-full rounded-lg shadow-md"
                      src={content.content} title="Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen loading="lazy" />
                  </div>
                </section>
              );
            }
            if (content.type === 'MATERIAL') {
              return (
                <section key={content.id} className="card p-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold m-0" style={{ color: 'var(--color-header)' }}>
                    Material de Estudio
                  </h2>
                  <a href={content.content} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    Descargar Material
                  </a>
                </section>
              );
            }
            return null;
          })}

          {topic.links.length > 0 && (
            <section className="card p-6">
              <h2 className="text-2xl font-semibold mb-3" style={{ color: 'var(--color-header)' }}>
                Tareas y Enlaces
              </h2>
              <ul className="list-disc list-inside space-y-2" style={{ color: 'var(--color-text-dark)' }}>
                {topic.links.map((link) => (
                  <li key={link.id}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer"
                      className="hover:underline transition" style={{ color: 'var(--color-accent)' }}>
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {topic.contents.length === 0 && topic.links.length === 0 && (
            <div className="text-center py-12 rounded-lg border-2 border-dashed"
              style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
              Aún no hay contenido publicado para este tema.
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
