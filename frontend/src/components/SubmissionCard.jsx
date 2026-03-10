import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import Card from './ui/Card';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/formatDate';

export default function SubmissionCard({ submission }) {
  const navigate = useNavigate();

  function handleClick() {
    navigate(`/dashboard/submissions/${submission.id}`);
  }

  const formattedDate = submission.created_at
    ? formatDate(submission.created_at, { short: true })
    : '';

  return (
    <Card hover className="cursor-pointer" onClick={handleClick}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3] line-clamp-2">
            {submission.title}
          </h3>
          <StatusBadge status={submission.status} />
        </div>

        <div className="flex items-center gap-4 text-xs text-[#8b949e]">
          <span className="font-mono bg-[#0d1117] px-2 py-0.5 rounded">
            {submission.tracking_code}
          </span>
          {submission.track_name && <span>{submission.track_name}</span>}
        </div>

        {formattedDate && (
          <div className="flex items-center gap-1.5 text-xs text-[#8b949e]">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formattedDate}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
