import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, FileText, ArrowRight } from 'lucide-react';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../utils/formatDate';

function getCountdown(deadlineStr) {
  if (!deadlineStr) return null;
  const now = new Date();
  const deadline = new Date(deadlineStr);
  const diff = deadline - now;

  if (diff <= 0) return { text: 'Plazo cerrado', expired: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return { text: `${days} día${days !== 1 ? 's' : ''} restante${days !== 1 ? 's' : ''}`, expired: false };
  }
  return { text: `${hours} hora${hours !== 1 ? 's' : ''} restante${hours !== 1 ? 's' : ''}`, expired: false };
}

function ConferenceCard({ conference }) {
  const countdown = getCountdown(conference.submission_deadline);

  return (
    <Link to={`/cfp/${conference.slug}`}>
      <Card hover className="h-full flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold font-['Outfit'] text-[#e6edf3] leading-tight">
            {conference.name}
          </h3>
          {conference.edition && (
            <Badge variant="accent">{conference.edition}</Badge>
          )}
        </div>

        <div className="flex flex-col gap-2 text-sm text-[#8b949e] flex-1">
          {conference.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{conference.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>Límite: {formatDate(conference.submission_deadline)}</span>
          </div>
          {conference.track_count > 0 && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span>{conference.track_count} track{conference.track_count !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#1e293b]">
          {countdown && (
            <div className="flex items-center gap-1.5">
              <Clock className={`h-4 w-4 ${countdown.expired ? 'text-red-400' : 'text-[#2dd4a8]'}`} />
              <span className={`text-xs font-medium ${countdown.expired ? 'text-red-400' : 'text-[#2dd4a8]'}`}>
                {countdown.text}
              </span>
            </div>
          )}
          <ArrowRight className="h-4 w-4 text-[#8b949e]" />
        </div>
      </Card>
    </Link>
  );
}

export default function HomePage() {
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/conferences')
      .then((data) => {
        setConferences(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#0d1117] border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold font-['Outfit'] text-[#e6edf3] mb-4">
            Open<span className="text-[#2dd4a8]">Papers</span>
          </h1>
          <p className="text-lg text-[#8b949e] max-w-2xl mx-auto">
            Plataforma de Call for Papers by TTPSEC SPA
          </p>
        </div>
      </section>

      {/* Conference Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-semibold font-['Outfit'] text-[#e6edf3] mb-8">
          Convocatorias Activas
        </h2>

        {loading && <LoadingSpinner />}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && conferences.length === 0 && (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-[#30363d] mx-auto mb-4" />
            <p className="text-[#8b949e] text-lg">No hay convocatorias activas</p>
          </div>
        )}

        {!loading && !error && conferences.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conferences.map((conference) => (
              <ConferenceCard key={conference.id} conference={conference} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
