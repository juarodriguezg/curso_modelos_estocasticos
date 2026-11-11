// Genera un slug legible para URLs a partir de un texto arbitrario.
// Normaliza acentos, pasa a minúsculas, reemplaza ñ, elimina caracteres no
// alfanuméricos y colapsa espacios/guiones. Reutilizado por el panel de
// administración y los endpoints de creación de temas.
export function generarSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ñ/g, "n")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
