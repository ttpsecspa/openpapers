const VARIANTS = {
  success: 'bg-green-500/15 text-green-400 border-green-500/25',
  warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  error: 'bg-red-500/15 text-red-400 border-red-500/25',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  neutral: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
  accent: 'bg-[#2dd4a8]/15 text-[#2dd4a8] border-[#2dd4a8]/25',
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
