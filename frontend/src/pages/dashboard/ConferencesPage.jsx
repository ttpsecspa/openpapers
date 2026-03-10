import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
} from 'lucide-react';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../utils/formatDate';

function ConferenceCard({ conference, onEdit, onDelete }) {
  return (
    <Card hover>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold font-['Outfit'] text-[#e6edf3]">
            {conference.name}
          </h3>
          <Badge variant={conference.is_active ? 'success' : 'neutral'}>
            {conference.is_active ? 'Activa' : 'Inactiva'}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#8b949e]">
          <span className="font-mono bg-[#0d1117] px-2 py-0.5 rounded">
            {conference.slug}
          </span>
          {conference.edition && (
            <span>Edicion: {conference.edition}</span>
          )}
        </div>

        {conference.location && (
          <div className="flex items-center gap-1.5 text-sm text-[#8b949e]">
            <MapPin className="h-3.5 w-3.5" />
            <span>{conference.location}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-sm text-[#8b949e]">
          <Calendar className="h-3.5 w-3.5" />
          <span>Fecha limite: {formatDate(conference.submission_deadline, { short: true })}</span>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-[#1e293b]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(conference)}
            className="gap-1"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(conference)}
            className="gap-1 text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function ConferencesPage() {
  const navigate = useNavigate();
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchConferences();
  }, []);

  async function fetchConferences() {
    setLoading(true);
    try {
      const data = await api.get('/dashboard/conferences');
      setConferences(data.conferences || data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(conference) {
    navigate(`/dashboard/conferences/${conference.id}/edit`);
  }

  function handleDeleteRequest(conference) {
    setDeleteTarget(conference);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/dashboard/conferences/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchConferences();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-['Outfit'] text-[#e6edf3]">
          Conferencias
        </h1>
        <Button
          size="sm"
          to="/dashboard/conferences/new"
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Nueva Conferencia
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {conferences.length === 0 ? (
        <Card>
          <p className="text-sm text-[#8b949e] text-center py-8">
            No hay conferencias creadas
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {conferences.map((conference) => (
            <ConferenceCard
              key={conference.id}
              conference={conference}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          title="Confirmar Eliminacion"
          onClose={() => setDeleteTarget(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-[#8b949e]">
              Estas seguro de que deseas eliminar la conferencia{' '}
              <span className="text-[#e6edf3] font-medium">{deleteTarget.name}</span>?
              Esta accion no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteConfirm}
                loading={deleteLoading}
                disabled={deleteLoading}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
