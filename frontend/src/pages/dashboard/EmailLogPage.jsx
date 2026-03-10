import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Mail,
} from 'lucide-react';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDateTime } from '../../utils/formatDate';

const TEMPLATE_OPTIONS = [
  { value: '', label: 'Todas las plantillas' },
  { value: 'submission_confirmation', label: 'Confirmación de Envío' },
  { value: 'review_assignment', label: 'Asignación de Revisión' },
  { value: 'review_completed', label: 'Revisión Completada' },
  { value: 'status_notification', label: 'Notificación de Estado' },
  { value: 'reviewer_invitation', label: 'Invitación de Revisor' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'sent', label: 'Enviado' },
  { value: 'failed', label: 'Fallido' },
  { value: 'pending', label: 'Pendiente' },
];

function getStatusVariant(status) {
  if (status === 'sent') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'pending') return 'warning';
  return 'neutral';
}

function getStatusLabel(status) {
  if (status === 'sent') return 'Enviado';
  if (status === 'failed') return 'Fallido';
  if (status === 'pending') return 'Pendiente';
  return status;
}

export default function EmailLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [templateFilter, setTemplateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('page', String(page));
    if (templateFilter) params.set('template', templateFilter);
    if (statusFilter) params.set('status', statusFilter);

    try {
      const data = await api.get(`/dashboard/email-log?${params.toString()}`);
      setLogs(data.logs || data.data || []);
      setTotalPages(data.total_pages || data.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, templateFilter, statusFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns = [
    {
      key: 'created_at',
      label: 'Fecha',
      render: (value) => (
        <span className="text-xs text-[#8b949e]">{formatDateTime(value)}</span>
      ),
    },
    {
      key: 'recipient',
      label: 'Destinatario',
      render: (value) => (
        <div className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 text-[#8b949e]" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'Asunto',
      render: (value) => (
        <span className="line-clamp-1">{value}</span>
      ),
    },
    {
      key: 'template',
      label: 'Plantilla',
      render: (value) => {
        const option = TEMPLATE_OPTIONS.find((o) => o.value === value);
        return (
          <span className="text-xs text-[#8b949e]">
            {option ? option.label : value}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Estado',
      render: (value) => (
        <Badge variant={getStatusVariant(value)}>
          {getStatusLabel(value)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-['Outfit'] text-[#e6edf3]">
        Registro de Correos
      </h1>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            name="template-filter"
            options={TEMPLATE_OPTIONS}
            value={templateFilter}
            onChange={(e) => {
              setTemplateFilter(e.target.value);
              setPage(1);
            }}
            className="sm:w-56"
          />
          <Select
            name="status-filter"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="sm:w-48"
          />
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <Table
          columns={columns}
          data={logs}
          emptyMessage="No hay registros de correo"
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm text-[#8b949e]">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
