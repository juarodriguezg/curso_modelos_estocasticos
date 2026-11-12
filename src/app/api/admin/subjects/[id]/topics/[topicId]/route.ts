import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// Un capítulo (tema sin padre) y sus secciones (temas con parentSlug = slug del
// capítulo) siempre pertenecen a la misma asignatura, para que el menú lateral
// conserve la jerarquía Parte → Capítulo → Sección. Por eso asociar o
// desasociar mueve la familia completa.

// PATCH - Asocia un tema existente a la asignatura (set subjectId = id).
// Si el tema es un capítulo, se asocian también sus secciones; si es una
// sección, se asocia con su capítulo y las demás secciones de este.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; topicId: string }> },
) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id, topicId } = await params;

    const subject = await prisma.subject.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!subject) {
      return NextResponse.json(
        { error: "Asignatura no encontrada" },
        { status: 404 },
      );
    }

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, slug: true, parentSlug: true },
    });
    if (!topic) {
      return NextResponse.json(
        { error: "Tema no encontrado" },
        { status: 404 },
      );
    }

    // Capítulo de la familia: el padre de la sección, o el propio tema. Si el
    // padre ya no existe, la sección está suelta y se asocia sola.
    const parent = topic.parentSlug
      ? await prisma.topic.findUnique({
          where: { slug: topic.parentSlug },
          select: { slug: true, title: true, subjectId: true },
        })
      : null;
    if (parent?.subjectId && parent.subjectId !== id) {
      return NextResponse.json(
        {
          error: `Su capítulo «${parent.title}» pertenece a otra asignatura; desasócialo primero`,
        },
        { status: 409 },
      );
    }
    const rootSlug = parent ? parent.slug : topic.slug;

    const { count } = await prisma.topic.updateMany({
      where: { OR: [{ slug: rootSlug }, { parentSlug: rootSlug }] },
      data: { subjectId: id },
    });

    return NextResponse.json({
      message:
        count > 1
          ? `Se asociaron ${count} temas (capítulo y secciones)`
          : "Tema asociado a la asignatura",
      count,
    });
  } catch (error) {
    console.error("Error asociando tema:", error);
    return NextResponse.json(
      { error: "Error asociando tema" },
      { status: 500 },
    );
  }
}

// DELETE - Desasocia el tema de la asignatura (set subjectId = null).
// No borra el tema; solo rompe el vínculo. Un capítulo se desasocia junto con
// sus secciones. Una sección cuyo capítulo sigue en la asignatura no se puede
// desasociar sola.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; topicId: string }> },
) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id, topicId } = await params;

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, slug: true, parentSlug: true, subjectId: true },
    });
    if (!topic) {
      return NextResponse.json(
        { error: "Tema no encontrado" },
        { status: 404 },
      );
    }
    if (topic.subjectId !== id) {
      return NextResponse.json(
        { error: "El tema no pertenece a esta asignatura" },
        { status: 400 },
      );
    }

    if (topic.parentSlug) {
      const parent = await prisma.topic.findUnique({
        where: { slug: topic.parentSlug },
        select: { title: true, subjectId: true },
      });
      if (parent?.subjectId === id) {
        return NextResponse.json(
          {
            error: `Esta sección es parte del capítulo «${parent.title}»; desasocia el capítulo para quitarla junto con él`,
          },
          { status: 409 },
        );
      }
    }

    const { count } = await prisma.topic.updateMany({
      where: {
        subjectId: id,
        OR: [{ id: topic.id }, { parentSlug: topic.slug }],
      },
      data: { subjectId: null },
    });

    return NextResponse.json({
      message:
        count > 1
          ? `Se desasociaron ${count} temas (capítulo y secciones)`
          : "Tema desasociado de la asignatura",
      count,
    });
  } catch (error) {
    console.error("Error desasociando tema:", error);
    return NextResponse.json(
      { error: "Error desasociando tema" },
      { status: 500 },
    );
  }
}
