import { useState } from 'react';
import { Search, Hash, FileText, Calendar, Tag } from 'lucide-react';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import ReviewScoreBar from '../../components/ReviewScoreBar';
import { formatDateTime } from '../../utils/formatDate';

const DECIDED_STATUSES = ['accepted', 'rejected', 'revision_requested'];

export default function TrackStatusPage() {
  const [code, setCode] = useState('');
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    setLoading(true);
    setError(null);
    setSubmission(null);
    setSearched(true);

    try {
      const data = await api.get(`/submissions/track/${trimmedCode}`);
      setSubmission(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const showReviews =
    submission &&
    DECIDED_STATUSES.includes(submission.status) &&
    submission.reviews &&
    submission.reviews.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-['Outfit'] text-[#e6edf3] mb-2">
          Consultar Estado
        </h1>
        <p className="text-[#8b949e]">
          Ingresa tu código de seguimiento para consultar el estado de tu envío.
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-3">
          <Input
            name="tracking-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código de seguimiento"
            className="flex-1"
          />
          <Button type="submit" loading={loading} disabled={loading || !code.trim()}>
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Buscar</span>
          </Button>
        </form>
      </Card>

      {/* Loading */}
      {loading && <LoadingSpinner />}

      {/* Error */}
      {error && searched && (
        <Card className="text-center py-8">
          <p className="text-red-400 mb-2">{error}</p>
          <p className="text-sm text-[#8b949e]">
            Verifica que el código de seguimiento sea correcto e intenta de nuevo.
          </p>
        </Card>
      )}

      {/* Result */}
      {submission && (
        <div className="space-y-6">
          {/* Status Header */}
          <Card>
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold font-['Outfit'] text-[#e6edf3]">
                {submission.title}
              </h2>
              <StatusBadge status={submission.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-[#8b949e]">
                <Hash className="h-4 w-4 flex-shrink-0" />
                <span>Código: <span className="text-[#e6edf3] font-mono">{submission.tracking_code}</span></span>
              </div>

              {submission.conference_name && (
                <div className="flex items-center gap-2 text-[#8b949e]">
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span>{submission.conference_name}</span>
                </div>
              )}

              {submission.track_name && (
                <div className="flex items-center gap-2 text-[#8b949e]">
                  <Tag className="h-4 w-4 flex-shrink-0" />
                  <span>{submission.track_name}</span>
                </div>
              )}

              {submission.submitted_at && (
                <div className="flex items-center gap-2 text-[#8b949e]">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Enviado: {formatDateTime(submission.submitted_at)}</span>
                </div>
              )}

              {submission.decided_at && (
                <div className="flex items-center gap-2 text-[#8b949e]">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Decidido: {formatDateTime(submission.decided_at)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Reviews */}
          {showReviews && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold font-['Outfit'] text-[#e6edf3]">
                Evaluaciones
              </h3>

              {submission.reviews.map((review, index) => (
                <Card key={review.id || index}>
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-[#8b949e]">
                      Evaluador {index + 1}
                    </p>

                    {/* Scores */}
                    {review.scores && (
                      <div className="space-y-3">
                        {review.scores.originality != null && (
                          <ReviewScoreBar label="Originalidad" value={review.scores.originality} />
                        )}
                        {review.scores.relevance != null && (
                          <ReviewScoreBar label="Relevancia" value={review.scores.relevance} />
                        )}
                        {review.scores.methodology != null && (
                          <ReviewScoreBar label="Metodologia" value={review.scores.methodology} />
                        )}
                        {review.scores.clarity != null && (
                          <ReviewScoreBar label="Claridad" value={review.scores.clarity} />
                        )}
                        {review.scores.overall != null && (
                          <ReviewScoreBar label="General" value={review.scores.overall} />
                        )}
                      </div>
                    )}

                    {/* Comments */}
                    {review.comments && (
                      <div>
                        <p className="text-sm font-medium text-[#e6edf3] mb-1">Comentarios</p>
                        <p className="text-sm text-[#8b949e] whitespace-pre-wrap">
                          {review.comments}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
