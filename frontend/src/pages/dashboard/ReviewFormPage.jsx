import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';

const RECOMMENDATION_OPTIONS = [
  { value: '', label: 'Seleccionar recomendacion...' },
  { value: 'strong_accept', label: 'Aceptar Fuertemente' },
  { value: 'accept', label: 'Aceptar' },
  { value: 'weak_accept', label: 'Aceptar Debilmente' },
  { value: 'weak_reject', label: 'Rechazar Debilmente' },
  { value: 'reject', label: 'Rechazar' },
  { value: 'strong_reject', label: 'Rechazar Fuertemente' },
];

const CONFIDENCE_OPTIONS = [
  { value: '', label: 'Seleccionar confianza...' },
  { value: '1', label: '1 - Muy baja' },
  { value: '2', label: '2 - Baja' },
  { value: '3', label: '3 - Media' },
  { value: '4', label: '4 - Alta' },
  { value: '5', label: '5 - Muy alta' },
];

const SCORE_FIELDS = [
  { key: 'overall_score', label: 'Puntuación General' },
  { key: 'originality_score', label: 'Originalidad' },
  { key: 'technical_score', label: 'Calidad Tecnica' },
  { key: 'clarity_score', label: 'Claridad' },
  { key: 'relevance_score', label: 'Relevancia' },
];

function getSliderColor(value) {
  if (value <= 3) return '#ef4444';
  if (value <= 6) return '#eab308';
  return '#22c55e';
}

function ScoreSlider({ label, value, onChange }) {
  const color = getSliderColor(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[#e6edf3]">{label}</label>
        <span
          className="text-sm font-bold px-2 py-0.5 rounded"
          style={{ color, backgroundColor: `${color}20` }}
        >
          {value}/10
        </span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${(value / 10) * 100}%, #0d1117 ${(value / 10) * 100}%, #0d1117 100%)`,
        }}
      />
      <div className="flex justify-between text-xs text-[#8b949e]">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}

export default function ReviewFormPage() {
  const { submissionId } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [scores, setScores] = useState({
    overall_score: 5,
    originality_score: 5,
    technical_score: 5,
    clarity_score: 5,
    relevance_score: 5,
  });
  const [recommendation, setRecommendation] = useState('');
  const [confidence, setConfidence] = useState('');
  const [commentsToAuthors, setCommentsToAuthors] = useState('');
  const [commentsToChairs, setCommentsToChairs] = useState('');

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get(`/dashboard/submissions/${submissionId}`)
      .then((data) => {
        setSubmission(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [submissionId]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      navigate('/dashboard/reviews');
    }, 2000);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  function handleScoreChange(key, value) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    const errors = {};

    if (!recommendation) {
      errors.recommendation = 'Selecciona una recomendacion';
    }
    if (!confidence) {
      errors.confidence = 'Selecciona un nivel de confianza';
    }
    if (!commentsToAuthors.trim()) {
      errors.comments_to_authors = 'Los comentarios para los autores son requeridos';
    } else if (commentsToAuthors.trim().length < 10) {
      errors.comments_to_authors = 'Los comentarios deben tener al menos 10 caracteres';
    }

    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setError(null);

    try {
      await api.post('/dashboard/reviews', {
        submission_id: Number(submissionId),
        ...scores,
        recommendation,
        confidence: Number(confidence),
        comments_to_authors: commentsToAuthors.trim(),
        comments_to_chairs: commentsToChairs.trim() || null,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  if (error && !submission) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <Button variant="secondary" onClick={() => navigate('/dashboard/reviews')}>
          Volver a Revisiones
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <CheckCircle2 className="h-16 w-16 text-[#2dd4a8] mx-auto" />
        <h2 className="text-xl font-bold font-['Outfit'] text-[#e6edf3]">
          Revisión Enviada
        </h2>
        <p className="text-sm text-[#8b949e]">
          Tu revision ha sido enviada exitosamente. Redirigiendo...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/dashboard/reviews')}
        className="gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Revisiones
      </Button>

      <h1 className="text-2xl font-bold font-['Outfit'] text-[#e6edf3]">
        Formulario de Revisión
      </h1>

      {/* Submission Context */}
      {submission && (
        <Card>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#2dd4a8]">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-mono bg-[#0d1117] px-2 py-0.5 rounded text-[#8b949e]">
                {submission.tracking_code}
              </span>
              <StatusBadge status={submission.status} />
            </div>
            <h2 className="text-lg font-semibold font-['Outfit'] text-[#e6edf3]">
              {submission.title}
            </h2>
            <p className="text-sm text-[#8b949e] line-clamp-3">
              {submission.abstract}
            </p>
          </div>
        </Card>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Score Sliders */}
        <Card>
          <h3 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3] mb-4">
            Puntuaciones
          </h3>
          <div className="space-y-6">
            {SCORE_FIELDS.map((field) => (
              <ScoreSlider
                key={field.key}
                label={field.label}
                value={scores[field.key]}
                onChange={(val) => handleScoreChange(field.key, val)}
              />
            ))}
          </div>
        </Card>

        {/* Recommendation and Confidence */}
        <Card>
          <h3 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3] mb-4">
            Evaluación
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Recomendacion"
              name="recommendation"
              options={RECOMMENDATION_OPTIONS}
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              error={formErrors.recommendation}
            />
            <Select
              label="Confianza"
              name="confidence"
              options={CONFIDENCE_OPTIONS}
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              error={formErrors.confidence}
            />
          </div>
        </Card>

        {/* Comments */}
        <Card>
          <h3 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3] mb-4">
            Comentarios
          </h3>
          <div className="space-y-4">
            <Input
              label="Comentarios para los autores (requerido)"
              name="comments_to_authors"
              as="textarea"
              value={commentsToAuthors}
              onChange={(e) => setCommentsToAuthors(e.target.value)}
              placeholder="Escribe tus comentarios para los autores (minimo 10 caracteres)..."
              error={formErrors.comments_to_authors}
            />
            <Input
              label="Comentarios para los chairs (opcional)"
              name="comments_to_chairs"
              as="textarea"
              value={commentsToChairs}
              onChange={(e) => setCommentsToChairs(e.target.value)}
              placeholder="Comentarios confidenciales para los organizadores..."
            />
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            loading={submitting}
            disabled={submitting}
            className="gap-1.5"
          >
            <CheckCircle2 className="h-4 w-4" />
            Enviar Revisión
          </Button>
        </div>
      </form>
    </div>
  );
}
