import { Prisma } from "@prisma/client";
import { hashPassword, isValidEmail } from "@/lib/auth";
import { syncLegacyGrupo } from "@/lib/courses";
import { prisma } from "@/lib/prisma";

export interface StudentInput {
  firstName: string;
  lastName: string;
  email: string;
  documentId: string;
}

type Failure = { ok: false; status: number; error: string };

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// Valida y normaliza los datos del formulario de estudiante (RF-CUR-02).
export function parseStudentInput(
  body: Record<string, unknown>,
): { ok: true; data: StudentInput } | Failure {
  const data: StudentInput = {
    firstName: str(body.firstName),
    lastName: str(body.lastName),
    email: str(body.email).toLowerCase(),
    documentId: str(body.documentId),
  };
  if (!data.firstName || !data.lastName || !data.email || !data.documentId) {
    return {
      ok: false,
      status: 400,
      error: "Nombre, apellido, correo y documento son obligatorios",
    };
  }
  if (!isValidEmail(data.email)) {
    return { ok: false, status: 400, error: `Correo inválido: ${data.email}` };
  }
  return { ok: true, data };
}

export function fullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

class EnrollError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export type EnrollResult =
  | {
      ok: true;
      enrollmentId: string;
      userCreated: boolean;
      reactivated: boolean;
    }
  | Failure;

// RF-CUR-02: crea la cuenta del estudiante si no existe (o reutiliza la del
// mismo correo) y lo matricula en el curso. Un estudiante no puede quedar
// matriculado dos veces en el mismo curso; si la matrícula estaba desactivada,
// se reactiva. El llamador debe comprobar antes que el curso no esté finalizado.
export async function enrollStudent(
  courseId: string,
  input: StudentInput,
): Promise<EnrollResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const byEmail = await tx.user.findUnique({
        where: { email: input.email },
      });
      if (byEmail && byEmail.role !== "student") {
        throw new EnrollError(
          400,
          `${input.email} pertenece a un administrador; no se puede matricular`,
        );
      }

      const byDocument = await tx.user.findUnique({
        where: { documentId: input.documentId },
      });
      if (byDocument && byDocument.id !== byEmail?.id) {
        throw new EnrollError(
          409,
          `El documento ${input.documentId} ya pertenece a otra cuenta (${byDocument.email})`,
        );
      }
      if (byEmail?.documentId && byEmail.documentId !== input.documentId) {
        throw new EnrollError(
          409,
          `${input.email} ya está registrado con otro documento`,
        );
      }

      const profile = {
        firstName: input.firstName,
        lastName: input.lastName,
        name: fullName(input.firstName, input.lastName),
        documentId: input.documentId,
      };
      const user = byEmail
        ? await tx.user.update({ where: { id: byEmail.id }, data: profile })
        : await tx.user.create({
            data: {
              ...profile,
              email: input.email,
              role: "student",
              // Misma convención que la carga CSV: contraseña inicial = documento.
              password: await hashPassword(input.documentId),
            },
          });

      const existing = await tx.courseEnrollment.findUnique({
        where: { courseId_userId: { courseId, userId: user.id } },
      });
      if (existing?.active) {
        throw new EnrollError(
          409,
          `${input.email} ya está matriculado en este curso`,
        );
      }

      const enrollment = existing
        ? await tx.courseEnrollment.update({
            where: { id: existing.id },
            data: { active: true, deactivatedAt: null },
          })
        : await tx.courseEnrollment.create({
            data: { courseId, userId: user.id },
          });

      await syncLegacyGrupo(tx, user.id);

      return {
        ok: true as const,
        enrollmentId: enrollment.id,
        userCreated: !byEmail,
        reactivated: Boolean(existing),
      };
    });
  } catch (error) {
    if (error instanceof EnrollError) {
      return { ok: false, status: error.status, error: error.message };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        status: 409,
        error: `${input.email}: el correo o el documento ya están en uso`,
      };
    }
    throw error;
  }
}
