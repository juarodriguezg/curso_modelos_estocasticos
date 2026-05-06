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
    <div className="flex min-h-screen [background:var(--color-background)]">
      <Sidebar />

      <div className="flex flex-col flex-grow">
        <header className="flex justify-between items-center [background:var(--color-header)] px-8 py-4 shadow-md">
          <div className="flex-1"></div>
          <h1 className="text-3xl font-bold [color:var(--color-text-light)] text-center flex-1">
            {topic.title}
          </h1>
          <div className="flex-1 text-right">
            <a
              href="/perfil"
              className="px-4 py-2 [background:var(--color-button)] [color:var(--color-text-light)] rounded-md hover:[background:var(--color-section)] transition"
            >
              Perfil
            </a>
          </div>
        </header>

        <main className="flex-grow max-w-4xl mx-auto p-8 space-y-8 w-full">
          {topic.contents.map((content) => {
            if (content.type === 'TEXT') {
              return (
                <section key={content.id} className="[background:var(--color-background)] border border-[color:var(--color-section)] p-6 rounded-lg shadow-sm">
                  <div 
                    className="[color:var(--color-text-dark)] leading-relaxed space-y-4 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: content.content }} 
                  />
                </section>
              );
            }
            if (content.type === 'VIDEO') {
              return (
                <section key={content.id} className="[background:var(--color-background)] border border-[color:var(--color-section)] p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold [color:var(--color-header)] mb-3">
                    Video
                  </h2>
                  <div className="aspect-video">
                    <iframe
                      className="w-full h-full rounded-lg shadow-md"
                      src={content.content}
                      title={`Video`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    ></iframe>
                  </div>
                </section>
              );
            }
            if (content.type === 'MATERIAL') {
              return (
                <section key={content.id} className="[background:var(--color-background)] border border-[color:var(--color-section)] p-6 rounded-lg shadow-sm flex items-center justify-between">
                  <h2 className="text-lg font-semibold [color:var(--color-header)] m-0">
                    Material de Estudio
                  </h2>
                  <a
                    href={content.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2 [background:var(--color-button)] [color:var(--color-text-light)] rounded-lg shadow hover:[background:var(--color-section)] transition"
                  >
                    Descargar Material
                  </a>
                </section>
              );
            }
            return null;
          })}

          {topic.links.length > 0 && (
            <section className="[background:var(--color-background)] border border-[color:var(--color-section)] p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-semibold [color:var(--color-header)] mb-3">
                Tareas y Enlaces
              </h2>
              <ul className="list-disc list-inside space-y-2 [color:var(--color-text-dark)]">
                {topic.links.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[color:var(--color-button)] hover:text-[color:var(--color-header)] hover:underline"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {topic.contents.length === 0 && topic.links.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              Aún no hay contenido publicado para este tema.
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
