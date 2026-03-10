import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  Send,
} from 'lucide-react';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../utils/formatDate';

const TAB_ITEMS = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'completed', label: 'Completadas' },
];

function ReviewCard({ review, onNavigate }) {
  const isPending = review.status === 'pending';

  return (
    <Card hover className="cursor-pointer" onClick={() => onNavigate(review)}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-[#2dd4a8]">
            <FileText className="h-4 w-4 flex-shrink-0" />
            <h3 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3] line-clamp-2">
              {review.submission_title || review.title}
            </h3>
          </div>
          <Badge variant={isPending ? 'warning' : 'success'}>
            {isPending ? 'Pendiente' : 'Completada'}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#8b949e]">
          <span className="font-mono bg-[#0d1117] px-2 py-0.5 rounded">
            {review.tracking_code}
          </span>
        </div>

        {review.deadline && (
          <div className="flex items-center gap-1.5 text-xs text-[#8b949e]">
            <Calendar className="h-3.5 w-3.5" />
            <span>Fecha límite: {formatDate(review.deadline, { short: true })}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-[#8b949e]">
          {isPending ? (
            <Clock className="h-3.5 w-3.5" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
          )}
          <span>
            {isPending ? 'Pendiente de revisión' : `Completada el ${formatDate(review.completed_at, { short: true })}`}
          </span>
        </div>

        {isPending && (
          <Button
            size="sm"
            className="w-full gap-1.5 mt-2"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(review);
            }}
          >
            <Send className="h-3.5 w-3.5" />
            Enviar Revisión
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function ReviewsPage() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    api.get('/dashboard/reviews/my')
      .then((data) => {
        setReviews(data.reviews || data || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function handleNavigate(review) {
    const submissionId = review.submission_id || review.id;
    navigate(`/dashboard/reviews/${submissionId}`);
  }

  const pendingReviews = reviews.filter((r) => r.status === 'pending');
  const completedReviews = reviews.filter((r) => r.status === 'completed');
  const displayedReviews = activeTab === 'pending' ? pendingReviews : completedReviews;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-['Outfit'] text-[#e6edf3]">
        Mis Revisiones
      </h1>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <Tabs tabs={TAB_ITEMS} activeKey={activeTab} onChange={setActiveTab} />

      {displayedReviews.length === 0 ? (
        <Card>
          <p className="text-sm text-[#8b949e] text-center py-8">
            {activeTab === 'pending'
              ? 'No tienes revisiones pendientes'
              : 'No tienes revisiones completadas'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
