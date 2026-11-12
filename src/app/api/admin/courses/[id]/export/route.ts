import ExcelJS from "exceljs";
import { type NextRequest, NextResponse } from "next/server";
import { courseLabel } from "@/lib/courses";
import { formatDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// GET - Exporta un curso finalizado a Excel (RF-CUR-09). El archivo se genera
// en memoria (Vercel no tiene disco persistente). Al terminar se marca
// exportedAt, que es requisito para purgar. Los módulos futuros (bonos,
// tareas, asistencia...) deben añadir aquí sus hojas.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        subject: true,
        period: true,
        enrollments: {
          include: { user: true },
          orderBy: { user: { name: "asc" } },
        },
      },
    });
    if (!course) {
      return NextResponse.json(
        { error: "Curso no encontrado" },
        { status: 404 },
      );
    }
    if (course.status !== "FINALIZED") {
      return NextResponse.json(
        { error: "Solo se pueden exportar cursos finalizados" },
        { status: 409 },
      );
    }

    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();

    const info = workbook.addWorksheet("Curso");
    info.columns = [
      { header: "Campo", key: "k", width: 22 },
      { header: "Valor", key: "v", width: 50 },
    ];
    info.addRows([
      { k: "Asignatura", v: `${course.subject.code} — ${course.subject.name}` },
      { k: "Periodo", v: course.period.name },
      { k: "Grupo", v: course.group },
      { k: "Inicio", v: formatDateOnly(course.period.startDate) },
      { k: "Final", v: formatDateOnly(course.period.endDate) },
      { k: "Estado", v: course.status },
      { k: "Finalizado el", v: course.finalizedAt?.toISOString() ?? "" },
      { k: "Exportado el", v: new Date().toISOString() },
    ]);

    const students = workbook.addWorksheet("Estudiantes");
    students.columns = [
      { header: "Nombre", key: "firstName", width: 24 },
      { header: "Apellidos", key: "lastName", width: 24 },
      { header: "Nombre completo", key: "name", width: 32 },
      { header: "Correo", key: "email", width: 32 },
      { header: "Documento", key: "documentId", width: 16 },
      { header: "Monitor", key: "isMonitor", width: 10 },
      { header: "Activo", key: "active", width: 10 },
      { header: "Matriculado el", key: "enrolledAt", width: 22 },
      { header: "Desactivado el", key: "deactivatedAt", width: 22 },
    ];
    students.addRows(
      course.enrollments.map((e) => ({
        firstName: e.user.firstName ?? "",
        lastName: e.user.lastName ?? "",
        name: e.user.name ?? "",
        email: e.user.email,
        documentId: e.user.documentId ?? "",
        isMonitor: e.isMonitor ? "Sí" : "No",
        active: e.active ? "Sí" : "No",
        enrolledAt: e.enrolledAt.toISOString(),
        deactivatedAt: e.deactivatedAt?.toISOString() ?? "",
      })),
    );

    const topics = workbook.addWorksheet("Temas");
    topics.columns = [
      { header: "Tema", key: "title", width: 50 },
      { header: "Visible", key: "visible", width: 10 },
      { header: "Fecha de publicación", key: "publishDate", width: 20 },
    ];
    // Temario heredado de la asignatura con su estado efectivo en el curso
    // (sin fila en CourseTopic = visible y sin fecha).
    const subjectTopics = await prisma.topic.findMany({
      where: { subjectId: course.subjectId },
      orderBy: { order: "asc" },
      select: { title: true, courseTopics: { where: { courseId: id } } },
    });
    topics.addRows(
      subjectTopics.map(({ title, courseTopics: [ct] }) => ({
        title,
        visible: (ct?.visible ?? true) ? "Sí" : "No",
        publishDate: ct?.publishDate ? formatDateOnly(ct.publishDate) : "",
      })),
    );

    for (const sheet of workbook.worksheets)
      sheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    await prisma.course.update({
      where: { id },
      data: { exportedAt: new Date() },
    });

    const filename = `curso-${courseLabel(course)}`
      .normalize("NFD")
      .replace(/[^\w-]+/g, "_");
    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error exportando curso:", error);
    return NextResponse.json(
      { error: "Error exportando curso" },
      { status: 500 },
    );
  }
}
