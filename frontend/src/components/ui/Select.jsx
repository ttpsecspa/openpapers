import { ChevronDown } from 'lucide-react';

export default function Select({
  label,
  options = [],
  error,
  id,
  className = '',
  ...props
}) {
  const selectId = id || props.name;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-[#e6edf3]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`w-full appearance-none bg-[#0d1117] border rounded-lg px-3 py-2 pr-8 text-sm text-[#e6edf3] focus:outline-none focus:border-[#2dd4a8] transition-colors ${
            error ? 'border-red-500' : 'border-[#30363d]'
          }`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b949e] pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
