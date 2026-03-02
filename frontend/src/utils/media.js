const MEDIA_BASE_URL =
  import.meta.env.VITE_MEDIA_BASE_URL || 'http://localhost:3000';

export default function getMediaUrl(path) {
  // Normaliza y evita null
  if (!path) return '';
  const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${MEDIA_BASE_URL}/${normalized}`;
}
