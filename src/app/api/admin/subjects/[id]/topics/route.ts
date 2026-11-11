import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { generarSlug } from "@/lib/slug";

// GET - Lista los temas asociados a una asignatura (ordenados)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id } = await params;
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

    const topics = await prisma.topic.findMany({
      where: { subjectId: id },
      orderBy: { order: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        order: true,
        parte: true,
        parentSlug: true,
      },
    });

    return NextResponse.json({ topics });
  } catch (error) {
    console.error("Error listando temas de la asignatura:", error);
    return NextResponse.json(
      { error: "Error listando temas de la asignatura" },
      { status: 500 },
    );
  }
}

// POST - Crea un tema nuevo ligado a la asignatura (RF-ASG-02).
// Campos: title (obligatorio), slug (opcional, se autogenera y se garantiza
// único), parte y parentSlug (opcionales). Replica el formulario de /perfil,
// con la salvedad de que parentSlug solo debe apuntar a un tema de la asignatura
// (la UI ya restringe el selector; aquí se valida en el servidor).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id } = await params;
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

    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json(
        { error: "El nombre del tema es obligatorio" },
        { status: 400 },
      );
    }

    const parte =
      typeof body.parte === "string" && body.parte.trim()
        ? body.parte.trim()
        : null;
    const parentSlug =
      typeof body.parentSlug === "string" && body.parentSlug.trim()
        ? body.parentSlug.trim()
        : null;

    // Si viene un tema padre, debe pertenecer a esta misma asignatura.
    if (parentSlug) {
      const parent = await prisma.topic.findUnique({
        where: { slug: parentSlug },
        select: { subjectId: true },
      });
      if (!parent) {
        return NextResponse.json(
          { error: "El tema padre no existe" },
          { status: 400 },
        );
      }
      if (parent.subjectId !== id) {
        return NextResponse.json(
          { error: "El tema padre debe pertenecer a esta asignatura" },
          { status: 400 },
        );
      }
    }

    // Slug: usar el provisto (normalizado) o generarlo del título. Garantizar único.
    const requestedSlug =
      typeof body.slug === "string" && body.slug.trim()
        ? generarSlug(body.slug)
        : generarSlug(title);
    const baseSlug = requestedSlug || "tema";
    let slug = baseSlug;
    let suffix = 1;
    while (
      await prisma.topic.findUnique({ where: { slug }, select: { id: true } })
    ) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    // order = max + 1
    const maxTopic = await prisma.topic.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const newOrder = maxTopic ? maxTopic.order + 1 : 1;

    const topic = await prisma.topic.create({
      data: {
        title,
        slug,
        order: newOrder,
        parte,
        parentSlug,
        subjectId: id,
        visibleGroup1: true,
        visibleGroup2: true,
      },
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
      message: "Tema creado y asociado a la asignatura",
      topic,
    });
  } catch (error) {
    console.error("Error creando tema en la asignatura:", error);
    return NextResponse.json(
      { error: "Error creando tema en la asignatura" },
      { status: 500 },
    );
  }
}
