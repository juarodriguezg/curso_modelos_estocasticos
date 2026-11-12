// Llamadas del panel de administración a /api/admin/*, con el Bearer token
// guardado en localStorage (mismo mecanismo que el resto del panel).
export async function adminFetch<T = Record<string, unknown>>(
  url: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; data: T & { error?: string; warnings?: string[] } }> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token ?? ""}`,
  };
  if (init.body && !(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  try {
    const res = await fetch(url, { ...init, headers });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch {
    return {
      ok: false,
      data: { error: "Error de conexión" } as T & { error?: string },
    };
  }
}

export interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  courseCount?: number;
}

export interface Course {
  id: string;
  label: string;
  group: string;
  status: "ACTIVE" | "FINALIZED";
  finalizedAt: string | null;
  reactivatedAt: string | null;
  exportedAt: string | null;
  purgedAt: string | null;
  subject: { id: string; code: string; name: string };
  period: Period;
  activeStudents: number;
}
