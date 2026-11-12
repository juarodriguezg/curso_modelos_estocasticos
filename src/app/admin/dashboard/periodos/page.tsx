import { requireAdminPage } from "@/lib/session";
import PeriodsClient from "./PeriodsClient";

// Server Component "portero": valida rol admin en el servidor antes de renderizar.
export default async function PeriodsPage() {
  await requireAdminPage();
  return <PeriodsClient />;
}
