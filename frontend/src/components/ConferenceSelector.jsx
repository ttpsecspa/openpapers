import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import api from '../api/client';

export default function ConferenceSelector({ value, onChange }) {
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasAutoSelected = useRef(false);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/dashboard/conferences')
      .then((data) => {
        if (cancelled) return;
        setConferences(data);
        if (!hasAutoSelected.current && !value && data.length > 0) {
          hasAutoSelected.current = true;
          onChange(data[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setConferences([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="px-3 py-2 text-sm text-[#8b949e]">Cargando...</div>
    );
  }

  if (conferences.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-[#8b949e]">
        Sin conferencias
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full appearance-none bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 pr-8 text-sm text-[#e6edf3] focus:outline-none focus:border-[#2dd4a8] transition-colors cursor-pointer"
      >
        {conferences.map((conf) => (
          <option key={conf.id} value={conf.id}>
            {conf.name}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b949e] pointer-events-none" />
    </div>
  );
}
