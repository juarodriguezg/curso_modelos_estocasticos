// Los videos se insertan como src de un <iframe>: solo se aceptan URLs https.
export function isSafeVideoUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

// Materiales y enlaces: http(s) o ruta relativa del sitio (p. ej. /documents/guia.pdf).
export function isSafeLinkUrl(value: string): boolean {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}
