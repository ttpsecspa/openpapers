import { Circle, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../utils/formatDate';

const TIMELINE_ITEMS = [
  { key: 'submission_deadline', label: 'Fecha límite de envío' },
  { key: 'notification_date', label: 'Notificación de resultados' },
  { key: 'camera_ready_date', label: 'Versión Camera Ready' },
  { key: 'start_date', label: 'Inicio de la conferencia' },
  { key: 'end_date', label: 'Fin de la conferencia' },
];

function getState(dateStr) {
  if (!dateStr) return 'future';
  const now = new Date();
  const date = new Date(dateStr);
  if (date < now) return 'past';
  return 'future';
}

export default function TimelineDeadlines({ dates = {} }) {
  const items = TIMELINE_ITEMS.map((item) => ({
    ...item,
    date: dates[item.key],
    state: getState(dates[item.key]),
  }));

  // The first future item is "active"
  const firstFutureIndex = items.findIndex((item) => item.state === 'future');

  return (
    <div className="space-y-0">
      {items.map((item, index) => {
        const isActive = index === firstFutureIndex;
        const isPast = item.state === 'past';

        return (
          <div key={item.key} className="flex gap-4">
            {/* Vertical line and dot */}
            <div className="flex flex-col items-center">
              {isPast ? (
                <CheckCircle2 className="h-5 w-5 text-[#2dd4a8] flex-shrink-0" />
              ) : (
                <Circle
                  className={`h-5 w-5 flex-shrink-0 ${
                    isActive
                      ? 'text-[#2dd4a8] fill-[#2dd4a8]/20'
                      : 'text-[#30363d]'
                  }`}
                />
              )}
              {index < items.length - 1 && (
                <div
                  className={`w-px flex-1 min-h-[32px] ${
                    isPast ? 'bg-[#2dd4a8]/40' : 'bg-[#30363d]'
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-6">
              <p
                className={`text-sm font-medium ${
                  isActive ? 'text-[#2dd4a8]' : isPast ? 'text-[#8b949e]' : 'text-[#e6edf3]'
                }`}
              >
                {item.label}
              </p>
              <p className="text-xs text-[#8b949e] mt-0.5">
                {formatDate(item.date)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
