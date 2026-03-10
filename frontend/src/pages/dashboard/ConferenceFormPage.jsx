import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

let trackIdCounter = 0;

function createEmptyTrack() {
  return { id: `track-${Date.now()}-${++trackIdCounter}`, name: '', description: '' };
}

export default function ConferenceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    edition: '',
    description: '',
    location: '',
    submission_deadline: '',
    notification_date: '',
    camera_ready_date: '',
    start_date: '',
    end_date: '',
    is_active: true,
    is_double_blind: true,
    min_reviewers: 2,
  });

  const [tracks, setTracks] = useState([createEmptyTrack()]);

  useEffect(() => {
    if (!isEditing) return;

    api.get(`/dashboard/conferences/${id}`)
      .then((data) => {
        setForm({
          name: data.name || '',
          slug: data.slug || '',
          edition: data.edition || '',
          description: data.description || '',
          location: data.location || '',
          submission_deadline: data.submission_deadline?.slice(0, 10) || '',
          notification_date: data.notification_date?.slice(0, 10) || '',
          camera_ready_date: data.camera_ready_date?.slice(0, 10) || '',
          start_date: data.start_date?.slice(0, 10) || '',
          end_date: data.end_date?.slice(0, 10) || '',
          is_active: data.is_active ?? true,
          is_double_blind: data.is_double_blind ?? true,
          min_reviewers: data.min_reviewers ?? 2,
        });
        setSlugManuallyEdited(true);
        if (data.tracks && data.tracks.length > 0) {
          setTracks(data.tracks.map((t) => ({ id: `track-${Date.now()}-${++trackIdCounter}`, name: t.name, description: t.description || '' })));
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, isEditing]);

  function handleChange(field, value) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === 'name' && !slugManuallyEdited) {
        updated.slug = generateSlug(value);
      }

      return updated;
    });
  }

  function handleSlugChange(value) {
    setSlugManuallyEdited(true);
    setForm((prev) => ({ ...prev, slug: value }));
  }

  function handleTrackChange(index, field, value) {
    setTracks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addTrack() {
    setTracks((prev) => [...prev, createEmptyTrack()]);
  }

  function removeTrack(index) {
    if (tracks.length <= 1) return;
    setTracks((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const validTracks = tracks.filter((t) => t.name.trim());
    const payload = {
      ...form,
      min_reviewers: Number(form.min_reviewers),
      tracks: validTracks,
    };

    try {
      if (isEditing) {
        await api.put(`/dashboard/conferences/${id}`, payload);
      } else {
        await api.post('/dashboard/conferences', payload);
      }
      navigate('/dashboard/conferences');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/dashboard/conferences')}
        className="gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Conferencias
      </Button>

      <h1 className="text-2xl font-bold font-['Outfit'] text-[#e6edf3]">
        {isEditing ? 'Editar Conferencia' : 'Nueva Conferencia'}
      </h1>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <h3 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3] mb-4">
            Información General
          </h3>
          <div className="space-y-4">
            <Input
              label="Nombre de la conferencia"
              name="name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nombre de la conferencia"
              required
            />
            <Input
              label="Slug (URL)"
              name="slug"
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="nombre-conferencia"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Edicion"
                name="edition"
                value={form.edition}
                onChange={(e) => handleChange('edition', e.target.value)}
                placeholder="2025, 1ra, etc."
              />
              <Input
                label="Ubicacion"
                name="location"
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Ciudad, Pais"
              />
            </div>
            <Input
              label="Descripción"
              name="description"
              as="textarea"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descripción de la conferencia..."
            />
          </div>
        </Card>

        {/* Dates */}
        <Card>
          <h3 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3] mb-4">
            Fechas Importantes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fecha límite de envío"
              name="submission_deadline"
              type="date"
              value={form.submission_deadline}
              onChange={(e) => handleChange('submission_deadline', e.target.value)}
            />
            <Input
              label="Fecha de notificacion"
              name="notification_date"
              type="date"
              value={form.notification_date}
              onChange={(e) => handleChange('notification_date', e.target.value)}
            />
            <Input
              label="Fecha Camera Ready"
              name="camera_ready_date"
              type="date"
              value={form.camera_ready_date}
              onChange={(e) => handleChange('camera_ready_date', e.target.value)}
            />
            <Input
              label="Fecha de inicio"
              name="start_date"
              type="date"
              value={form.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
            />
            <Input
              label="Fecha de fin"
              name="end_date"
              type="date"
              value={form.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
            />
          </div>
        </Card>

        {/* Settings */}
        <Card>
          <h3 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3] mb-4">
            Configuración
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#e6edf3]">Conferencia activa</p>
                <p className="text-xs text-[#8b949e]">Permite recibir envios</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('is_active', !form.is_active)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  form.is_active ? 'bg-[#2dd4a8]' : 'bg-[#30363d]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    form.is_active ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#e6edf3]">Doble ciego</p>
                <p className="text-xs text-[#8b949e]">Revisiones anónimas</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('is_double_blind', !form.is_double_blind)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  form.is_double_blind ? 'bg-[#2dd4a8]' : 'bg-[#30363d]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    form.is_double_blind ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <Input
              label="Mínimo de revisores por envío"
              name="min_reviewers"
              type="number"
              min="1"
              max="10"
              value={form.min_reviewers}
              onChange={(e) => handleChange('min_reviewers', e.target.value)}
            />
          </div>
        </Card>

        {/* Tracks */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3]">
              Tracks
            </h3>
            <button
              type="button"
              onClick={addTrack}
              className="text-[#2dd4a8] hover:text-[#2dd4a8]/80 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {tracks.map((track, index) => (
              <div key={track.id} className="flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    name={`track-name-${index}`}
                    placeholder="Nombre del track"
                    value={track.name}
                    onChange={(e) => handleTrackChange(index, 'name', e.target.value)}
                  />
                  <Input
                    name={`track-desc-${index}`}
                    placeholder="Descripción (opcional)"
                    value={track.description}
                    onChange={(e) => handleTrackChange(index, 'description', e.target.value)}
                  />
                </div>
                {tracks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTrack(index)}
                    className="mt-2 text-[#8b949e] hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/dashboard/conferences')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={submitting}
            disabled={submitting}
            className="gap-1.5"
          >
            <Save className="h-4 w-4" />
            {isEditing ? 'Guardar Cambios' : 'Crear Conferencia'}
          </Button>
        </div>
      </form>
    </div>
  );
}
