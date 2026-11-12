import { requireAdminPage } from "@/lib/session";
import CourseDetailClient from "./CourseDetailClient";

// Server Component "portero": valida rol admin en el servidor antes de renderizar.
export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  return <CourseDetailClient courseId={id} />;
}
