function getBarColor(score) {
  if (score <= 3) return 'bg-red-500';
  if (score <= 6) return 'bg-yellow-500';
  return 'bg-green-500';
}

export default function ReviewScoreBar({ label, value, max = 10 }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const colorClass = getBarColor(value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#8b949e]">{label}</span>
        <span className="text-sm font-medium text-[#e6edf3]">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#0d1117] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
