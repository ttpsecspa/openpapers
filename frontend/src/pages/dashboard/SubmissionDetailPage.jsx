import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Download,
  UserPlus,
  Trash2,
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import ReviewScoreBar from '../../components/ReviewScoreBar';
import { formatDate } from '../../utils/formatDate';

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Enviado' },
  { value: 'under_review', label: 'En Revisión' },
  { value: 'accepted', label: 'Aceptado' },
  { value: 'rejected', label: 'Rechazado' },
  { value: 'revision_requested', label: 'Revisión Solicitada' },
  { value: 'withdrawn', label: 'Retirado' },
  { value: 'camera_ready', label: 'Camera Ready' },
];

const RECOMMENDATION_LABELS = {
  strong_accept: 'Aceptar Fuertemente',
  accept: 'Aceptar',
  weak_accept: 'Aceptar Debilmente',
  weak_reject: 'Rechazar Debilmente',
  reject: 'Rechazar',
  strong_reject: 'Rechazar Fuertemente',
};

function getRecommendationVariant(rec) {
  if (rec === 'strong_accept' || rec === 'accept') return 'success';
  if (rec === 'weak_accept') return 'warning';
  if (rec === 'weak_reject') return 'warning';
  if (rec === 'reject' || rec === 'strong_reject') return 'error';
  return 'neutral';
}

export default function SubmissionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusValue, setStatusValue] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableReviewers, setAvailableReviewers] = useState([]);
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    api.get(`/dashboard/submissions/${id}`)
      .then((data) => {
        setSubmission(data);
        setStatusValue(data.status);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  async function handleStatusChange(newStatus) {
    setStatusLoading(true);
    try {
      await api.patch(`/dashboard/submissions/${id}/status`, { status: newStatus });
      setSubmission((prev) => ({ ...prev, status: newStatus }));
      setStatusValue(newStatus);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatusLoading(false);
    }
  }

  async function openAssignModal() {
    setShowAssignModal(true);
    try {
      const data = await api.get(`/dashboard/reviewers?conference_id=${submission.conference_id}`);
      setAvailableReviewers(data.reviewers || data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAssignReviewer() {
    if (!selectedReviewer) return;
    setAssignLoading(true);
    try {
      await api.post(`/dashboard/submissions/${id}/assign`, {
        reviewer_id: selectedReviewer,
      });
      const data = await api.get(`/dashboard/submissions/${id}`);
      setSubmission(data);
      setShowAssignModal(false);
      setSelectedReviewer('');
    } catch (err) {
      setError(err.message);
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleRemoveReviewer(reviewerId) {
    try {
      await api.delete(`/dashboard/submissions/${id}/assign/${reviewerId}`);
      const data = await api.get(`/dashboard/submissions/${id}`);
      setSubmission(data);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <LoadingSpinner />;

  if (error && !submission) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <Button variant="secondary" onClick={() => navigate('/dashboard/submissions')}>
          Volver a Envios
        </Button>
      </div>
    );
  }

  if (!submission) return null;

  const reviews = submission.reviews || [];
  const assignedReviewers = submission.assigned_reviewers || [];
  const authors = submission.authors || [];

  const reviewerOptions = [
    { value: '', label: 'Seleccionar revisor...' },
    ...availableReviewers.map((r) => ({
      value: String(r.id),
      label: `${r.full_name} (${r.email})`,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/dashboard/submissions')}
        className="gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Envios
      </Button>

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-['Outfit'] text-[#e6edf3]">
            {submission.title}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm bg-[#0d1117] px-2 py-1 rounded text-[#8b949e]">
              {submission.tracking_code}
            </span>
            <StatusBadge status={submission.status} />
          </div>
        </div>

        {/* Admin Status Change */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Select
              name="change-status"
              options={STATUS_OPTIONS}
              value={statusValue}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-48"
            />
            {statusLoading && (
              <span className="text-xs text-[#8b949e]">Guardando...</span>
            )}
          </div>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Abstract */}
          <Card>
            <h2 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3] mb-3">
              Resumen
            </h2>
            <p className="text-sm text-[#8b949e] leading-relaxed whitespace-pre-line">
              {submission.abstract}
            </p>
          </Card>

          {/* Keywords */}
          {submission.keywords && (
            <Card>
              <h2 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3] mb-3">
                Palabras Clave
              </h2>
              <div className="flex flex-wrap gap-2">
                {(submission.keywords || '').split(',').filter(Boolean).map((kw) => (
                  <Badge key={kw.trim()} variant="neutral">
                    {kw.trim()}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Reviews Section */}
          <div>
            <h2 className="text-lg font-semibold font-['Outfit'] text-[#e6edf3] mb-4">
              Revisiones ({reviews.length})
            </h2>

            {reviews.length === 0 ? (
              <Card>
                <p className="text-sm text-[#8b949e] text-center py-4">
                  No hay revisiones disponibles
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <Card key={review.id || index}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#e6edf3]">
                          Revisión #{index + 1}
                        </span>
                        {review.recommendation && (
                          <Badge variant={getRecommendationVariant(review.recommendation)}>
                            {RECOMMENDATION_LABELS[review.recommendation] || review.recommendation}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <ReviewScoreBar label="General" value={review.overall_score} />
                        <ReviewScoreBar label="Originalidad" value={review.originality_score} />
                        <ReviewScoreBar label="Tecnico" value={review.technical_score} />
                        <ReviewScoreBar label="Claridad" value={review.clarity_score} />
                        <ReviewScoreBar label="Relevancia" value={review.relevance_score} />
                      </div>

                      {review.comments_to_authors && (
                        <div>
                          <h4 className="text-xs font-medium text-[#8b949e] mb-1">
                            Comentarios para los autores
                          </h4>
                          <p className="text-sm text-[#e6edf3] whitespace-pre-line">
                            {review.comments_to_authors}
                          </p>
                        </div>
                      )}

                      {isAdmin && review.comments_to_chairs && (
                        <div>
                          <h4 className="text-xs font-medium text-[#8b949e] mb-1">
                            Comentarios para los chairs
                          </h4>
                          <p className="text-sm text-[#e6edf3] whitespace-pre-line">
                            {review.comments_to_chairs}
                          </p>
                        </div>
                      )}

                      {review.confidence && (
                        <div className="text-xs text-[#8b949e]">
                          Confianza: {review.confidence}/5
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details Card */}
          <Card>
            <h3 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3] mb-3">
              Detalles
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-[#8b949e]">Track</span>
                <p className="text-[#e6edf3]">{submission.track_name || 'Sin track'}</p>
              </div>
              <div>
                <span className="text-[#8b949e]">Fecha de envío</span>
                <p className="text-[#e6edf3]">{formatDate(submission.created_at, { fallback: '' })}</p>
              </div>

              {/* Authors (admin only) */}
              {isAdmin && authors.length > 0 && (
                <div>
                  <span className="text-[#8b949e]">Autores</span>
                  <div className="mt-1 space-y-1">
                    {authors.map((author, i) => (
                      <p key={i} className="text-[#e6edf3]">
                        {author.name}
                        {author.is_corresponding && (
                          <Badge variant="accent" className="ml-2">Corresp.</Badge>
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {isAdmin && submission.submitted_by_email && (
                <div>
                  <span className="text-[#8b949e]">Enviado por</span>
                  <p className="text-[#e6edf3]">{submission.submitted_by_email}</p>
                </div>
              )}
            </div>
          </Card>

          {/* File Download */}
          {submission.file_url && (
            <Card>
              <h3 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3] mb-3">
                Archivo
              </h3>
              <a
                href={submission.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#2dd4a8] hover:underline"
              >
                <FileText className="h-4 w-4" />
                <Download className="h-3.5 w-3.5" />
                Descargar PDF
              </a>
            </Card>
          )}

          {/* Assign Reviewers (admin only) */}
          {isAdmin && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3]">
                  Revisores Asignados
                </h3>
                <button
                  onClick={openAssignModal}
                  className="text-[#2dd4a8] hover:text-[#2dd4a8]/80 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
              </div>

              {assignedReviewers.length === 0 ? (
                <p className="text-sm text-[#8b949e]">Sin revisores asignados</p>
              ) : (
                <div className="space-y-2">
                  {assignedReviewers.map((reviewer) => (
                    <div
                      key={reviewer.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <p className="text-[#e6edf3]">{reviewer.full_name}</p>
                        <p className="text-xs text-[#8b949e]">{reviewer.email}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveReviewer(reviewer.id)}
                        className="text-[#8b949e] hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Assign Reviewer Modal */}
      {showAssignModal && (
        <Modal title="Asignar Revisor" onClose={() => setShowAssignModal(false)}>
          <div className="space-y-4">
            <Select
              label="Seleccionar revisor"
              name="reviewer"
              options={reviewerOptions}
              value={selectedReviewer}
              onChange={(e) => setSelectedReviewer(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAssignModal(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleAssignReviewer}
                loading={assignLoading}
                disabled={!selectedReviewer || assignLoading}
              >
                Asignar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
