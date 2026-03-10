import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Users, Send, FileText } from 'lucide-react';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import TimelineDeadlines from '../../components/TimelineDeadlines';
import { formatDate } from '../../utils/formatDate';

const TRACK_COLORS = [
  'bg-[#2dd4a8]/15 text-[#2dd4a8] border-[#2dd4a8]/25',
  'bg-blue-500/15 text-blue-400 border-blue-500/25',
  'bg-purple-500/15 text-purple-400 border-purple-500/25',
  'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  'bg-pink-500/15 text-pink-400 border-pink-500/25',
  'bg-orange-500/15 text-orange-400 border-orange-500/25',
];

export default function CFPPage() {
  const { slug } = useParams();
  const [conference, setConference] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/conferences/${slug}`)
      .then((data) => {
        setConference(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-red-400 text-lg">{error}</p>
        <Button to="/" variant="secondary" className="mt-6">
          Volver al inicio
        </Button>
      </div>
    );
  }

  if (!conference) return null;

  const timelineDates = {
    submission_deadline: conference.submission_deadline,
    notification_date: conference.notification_date,
    camera_ready_date: conference.camera_ready_date,
    start_date: conference.start_date,
    end_date: conference.end_date,
  };

  const tracks = conference.tracks || [];

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#0d1117] border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-bold font-['Outfit'] text-[#e6edf3]">
                {conference.name}
              </h1>
              {conference.edition && (
                <Badge variant="accent">{conference.edition}</Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-[#8b949e] flex-wrap">
              {conference.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{conference.location}</span>
                </div>
              )}
              {conference.start_date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    {formatDate(conference.start_date)}
                  </span>
                </div>
              )}
              {conference.submission_count != null && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">
                    {conference.submission_count} envío{conference.submission_count !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {conference.description && (
              <Card>
                <h2 className="text-xl font-semibold font-['Outfit'] text-[#e6edf3] mb-4">
                  Descripción
                </h2>
                <div className="text-sm text-[#8b949e] leading-relaxed whitespace-pre-wrap">
                  {conference.description}
                </div>
              </Card>
            )}

            {/* Tracks */}
            {tracks.length > 0 && (
              <Card>
                <h2 className="text-xl font-semibold font-['Outfit'] text-[#e6edf3] mb-4">
                  Tracks
                </h2>
                <div className="flex flex-wrap gap-3">
                  {tracks.map((track, index) => (
                    <span
                      key={track.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${
                        TRACK_COLORS[index % TRACK_COLORS.length]
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {track.name}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Submit CTA */}
            <div className="flex justify-center py-4">
              <Button to={`/enviar/${slug}`} size="lg" className="gap-2">
                <Send className="h-5 w-5" />
                Enviar Paper
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold font-['Outfit'] text-[#e6edf3] mb-4">
                Fechas Importantes
              </h3>
              <TimelineDeadlines dates={timelineDates} />
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
