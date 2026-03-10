export default function Input({
  label,
  error,
  as = 'input',
  id,
  className = '',
  ...props
}) {
  const Tag = as === 'textarea' ? 'textarea' : 'input';
  const inputId = id || props.name;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[#e6edf3]"
        >
          {label}
        </label>
      )}
      <Tag
        id={inputId}
        className={`w-full bg-[#0d1117] border rounded-lg px-3 py-2 text-sm text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-[#2dd4a8] transition-colors ${
          error ? 'border-red-500' : 'border-[#30363d]'
        } ${as === 'textarea' ? 'min-h-[100px] resize-y' : ''}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
