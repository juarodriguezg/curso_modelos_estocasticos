import { requireAdminPage } from "@/lib/session";
import SubjectDetailClient from "./SubjectDetailClient";

// Server Component "portero": valida rol admin en el servidor antes de renderizar.
export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;

  return <SubjectDetailClient subjectId={id} />;
}
