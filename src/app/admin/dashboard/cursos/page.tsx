import { requireAdminPage } from "@/lib/session";
import CoursesClient from "./CoursesClient";

// Server Component "portero": valida rol admin en el servidor antes de renderizar.
export default async function CoursesPage() {
  await requireAdminPage();
  return <CoursesClient />;
}
