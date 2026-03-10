export function formatDate(dateStr, options = {}) {
  if (!dateStr) return options.fallback ?? 'Por definir';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: options.short ? 'short' : 'long',
    year: 'numeric',
    ...options,
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
