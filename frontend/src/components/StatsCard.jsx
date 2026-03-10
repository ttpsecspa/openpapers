import { TrendingUp, TrendingDown } from 'lucide-react';
import Card from './ui/Card';

export default function StatsCard({ icon: Icon, label, value, delta }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-[#8b949e]">{label}</p>
          <p className="text-2xl font-bold font-['Outfit'] text-[#e6edf3]">
            {value}
          </p>
          {delta != null && (
            <div className="flex items-center gap-1">
              {delta >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              )}
              <span
                className={`text-xs font-medium ${
                  delta >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {delta >= 0 ? '+' : ''}
                {delta}%
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-[#2dd4a8]/10">
            <Icon className="h-5 w-5 text-[#2dd4a8]" />
          </div>
        )}
      </div>
    </Card>
  );
}
