import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/formatDate';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'submitted', label: 'Enviado' },
  { value: 'under_review', label: 'En Revisión' },
  { value: 'accepted', label: 'Aceptado' },
  { value: 'rejected', label: 'Rechazado' },
  { value: 'revision_requested', label: 'Revisión Solicitada' },
  { value: 'withdrawn', label: 'Retirado' },
  { value: 'camera_ready', label: 'Camera Ready' },
];

export default function SubmissionsPage() {
  const navigate = useNavigate();
  const { activeConferenceId: conferenceId } = useOutletContext();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [submissions, setSubmissions] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [trackFilter, setTrackFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    if (!conferenceId) {
      setError('No hay conferencia activa seleccionada');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('conference_id', conferenceId);
    params.set('page', String(page));
    if (statusFilter) params.set('status', statusFilter);
    if (trackFilter) params.set('track_id', trackFilter);
    if (search.trim()) params.set('search', search.trim());

    try {
      const data = await api.get(`/dashboard/submissions?${params.toString()}`);
      setSubmissions(data.submissions || data.data || []);
      setTotalPages(data.total_pages || data.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [conferenceId, page, statusFilter, trackFilter, search]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  useEffect(() => {
    if (!conferenceId) return;
    api.get(`/dashboard/conferences/${conferenceId}`)
      .then((data) => {
        setTracks(data.tracks || []);
      })
      .catch(() => {});
  }, [conferenceId]);

  function handleRowClick(submission) {
    navigate(`/dashboard/submissions/${submission.id}`);
  }

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') {
      setPage(1);
      fetchSubmissions();
    }
  }

  function toggleSelection(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === submissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(submissions.map((s) => s.id));
    }
  }

  async function handleBulkStatusChange() {
    if (!bulkStatus || selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await api.patch('/dashboard/submissions/bulk-status', {
        submission_ids: selectedIds,
        status: bulkStatus,
      });
      setSelectedIds([]);
      setBulkStatus('');
      fetchSubmissions();
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkLoading(false);
    }
  }

  const trackOptions = [
    { value: '', label: 'Todos los tracks' },
    ...tracks.map((t) => ({ value: String(t.id), label: t.name })),
  ];

  const columns = [
    ...(isAdmin
      ? [
          {
            key: 'select',
            label: (
              <input
                type="checkbox"
                checked={selectedIds.length === submissions.length && submissions.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-[#30363d] bg-[#0d1117] text-[#2dd4a8]"
              />
            ),
            render: (_, row) => (
              <input
                type="checkbox"
                checked={selectedIds.includes(row.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleSelection(row.id);
                }}
                className="w-4 h-4 rounded border-[#30363d] bg-[#0d1117] text-[#2dd4a8]"
              />
            ),
          },
        ]
      : []),
    {
      key: 'tracking_code',
      label: 'Código',
      render: (value) => (
        <span className="font-mono text-xs bg-[#0d1117] px-2 py-0.5 rounded">
          {value}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Título',
      render: (value) => (
        <span className="font-medium line-clamp-1">{value}</span>
      ),
    },
    { key: 'track_name', label: 'Track' },
    {
      key: 'status',
      label: 'Estado',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'created_at',
      label: 'Fecha',
      render: (value) => (
        <span className="text-[#8b949e] text-xs">{formatDate(value, { short: true, fallback: '' })}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-['Outfit'] text-[#e6edf3]">
          Envios
        </h1>
        <Button variant="ghost" size="sm" onClick={fetchSubmissions}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b949e]" />
            <input
              type="text"
              placeholder="Buscar por título o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-sm text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-[#2dd4a8] transition-colors"
            />
          </div>
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
          <Select
            name="track-filter"
            options={trackOptions}
            value={trackFilter}
            onChange={(e) => {
              setTrackFilter(e.target.value);
              setPage(1);
            }}
            className="sm:w-48"
          />
        </div>
      </Card>

      {/* Bulk Actions (admin only) */}
      {isAdmin && selectedIds.length > 0 && (
        <Card>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#8b949e]">
              {selectedIds.length} seleccionado{selectedIds.length > 1 ? 's' : ''}
            </span>
            <Select
              name="bulk-status"
              options={[
                { value: '', label: 'Cambiar estado...' },
                ...STATUS_OPTIONS.filter((s) => s.value),
              ]}
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="w-48"
            />
            <Button
              size="sm"
              onClick={handleBulkStatusChange}
              loading={bulkLoading}
              disabled={!bulkStatus || bulkLoading}
            >
              Aplicar
            </Button>
          </div>
        </Card>
      )}

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
        <div
          className="cursor-pointer"
          onClick={(e) => {
            const row = e.target.closest('tr');
            if (!row || row.closest('thead')) return;
            const rowIndex = row.rowIndex - 1;
            if (rowIndex >= 0 && submissions[rowIndex]) {
              handleRowClick(submissions[rowIndex]);
            }
          }}
        >
          <Table
            columns={columns}
            data={submissions}
            emptyMessage="No se encontraron envíos"
          />
        </div>
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
