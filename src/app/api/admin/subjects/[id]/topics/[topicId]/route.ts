import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// PATCH - Asocia un tema existente a la asignatura (set subjectId = id)
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
      select: { id: true },
    });
    if (!topic) {
      return NextResponse.json(
        { error: "Tema no encontrado" },
        { status: 404 },
      );
    }

    const updated = await prisma.topic.update({
      where: { id: topicId },
      data: { subjectId: id },
      select: {
        id: true,
        slug: true,
        title: true,
        order: true,
        parte: true,
        parentSlug: true,
      },
    });

    return NextResponse.json({
      message: "Tema asociado a la asignatura",
      topic: updated,
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
// No borra el tema; solo rompe el vínculo.
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
      select: { id: true, subjectId: true },
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

    await prisma.topic.update({
      where: { id: topicId },
      data: { subjectId: null },
    });

    return NextResponse.json({ message: "Tema desasociado de la asignatura" });
  } catch (error) {
    console.error("Error desasociando tema:", error);
    return NextResponse.json(
      { error: "Error desasociando tema" },
      { status: 500 },
    );
  }
}
