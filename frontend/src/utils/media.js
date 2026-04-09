const configuredMediaBase = (import.meta.env.VITE_MEDIA_BASE_URL || '').trim();
const MEDIA_BASE_URL = configuredMediaBase || window.location.origin;

export default function getMediaUrl(path) {
  // Evita null y respeta URLs absolutas ya guardadas.
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;

  const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
  const base = MEDIA_BASE_URL.replace(/\/+$/, '');
  return `${base}/${normalized}`;
}
