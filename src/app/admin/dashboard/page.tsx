import { requireAdminPage } from "@/lib/session";
import DashboardClient from "./DashboardClient";

// Server Component "portero": valida la sesión y el rol admin en el servidor
// antes de renderizar nada. Un no-admin es redirigido y nunca recibe el HTML.
export default async function AdminDashboardPage() {
  const user = await requireAdminPage();

  return <DashboardClient userName={user.name ?? user.email} />;
}
