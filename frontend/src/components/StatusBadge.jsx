import Badge from './ui/Badge';

const STATUS_MAP = {
  submitted: { variant: 'info', label: 'Enviado' },
  under_review: { variant: 'warning', label: 'En Revisión' },
  accepted: { variant: 'success', label: 'Aceptado' },
  rejected: { variant: 'error', label: 'Rechazado' },
  revision_requested: { variant: 'warning', label: 'Revisión Solicitada' },
  withdrawn: { variant: 'neutral', label: 'Retirado' },
  camera_ready: { variant: 'accent', label: 'Camera Ready' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_MAP[status] || { variant: 'neutral', label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
