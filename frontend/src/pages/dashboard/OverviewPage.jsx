import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  Users,
} from 'lucide-react';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatsCard from '../../components/StatsCard';
import SubmissionCard from '../../components/SubmissionCard';

function BarChart({ title, data, maxValue }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3] mb-4">
          {title}
        </h3>
        <p className="text-sm text-[#8b949e] text-center py-6">
          Sin datos disponibles
        </p>
      </Card>
    );
  }

  const computedMax = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <Card>
      <h3 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3] mb-4">
        {title}
      </h3>
      <div className="space-y-3">
        {data.map((item) => {
          const percentage = Math.round((item.value / computedMax) * 100);
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8b949e] truncate mr-2">{item.label}</span>
                <span className="text-[#e6edf3] font-medium">{item.value}</span>
              </div>
              <div className="h-2 rounded-full bg-[#0d1117] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#2dd4a8] transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function OverviewPage() {
  const { activeConferenceId } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeConferenceId) {
      setError('No hay conferencia activa seleccionada');
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [statsData, submissionsData] = await Promise.all([
          api.get(`/dashboard/stats?conference_id=${activeConferenceId}`),
          api.get(`/dashboard/submissions?conference_id=${activeConferenceId}&page=1`),
        ]);
        if (controller.signal.aborted) return;
        setStats(statsData);
        const submissions = submissionsData.submissions || submissionsData.data || [];
        setRecentSubmissions(submissions.slice(0, 5));
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchData();

    return () => controller.abort();
  }, [activeConferenceId]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const submissionsByDate = (stats?.submissions_by_date || []).map((item) => ({
    label: new Date(item.date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    }),
    value: item.count,
  }));

  const submissionsByTrack = (stats?.submissions_by_track || []).map((item) => ({
    label: item.track_name,
    value: item.count,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-['Outfit'] text-[#e6edf3]">
        Panel General
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={FileText}
          label="Total de Envíos"
          value={stats?.total_submissions ?? 0}
        />
        <StatsCard
          icon={Clock}
          label="Revisiones Pendientes"
          value={stats?.pending_reviews ?? 0}
        />
        <StatsCard
          icon={CheckCircle2}
          label="Revisiones Completadas"
          value={stats?.completed_reviews ?? 0}
        />
        <StatsCard
          icon={Users}
          label="Revisores"
          value={stats?.reviewers_count ?? 0}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChart
          title="Envíos por Fecha"
          data={submissionsByDate}
        />
        <BarChart
          title="Envíos por Track"
          data={submissionsByTrack}
        />
      </div>

      {/* Recent Submissions */}
      <div>
        <h2 className="text-lg font-semibold font-['Outfit'] text-[#e6edf3] mb-4">
          Envios Recientes
        </h2>
        {recentSubmissions.length === 0 ? (
          <Card>
            <p className="text-sm text-[#8b949e] text-center py-6">
              No hay envíos recientes
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSubmissions.map((submission) => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
