import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-[#2dd4a8] text-[#06080d] hover:bg-[#2dd4a8]/90',
  secondary: 'border border-[#30363d] text-[#e6edf3] hover:border-[#8b949e] bg-transparent',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  to,
  className = '',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2dd4a8]/40 disabled:opacity-50 disabled:cursor-not-allowed';
  const classes = `${baseClasses} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  if (to && !disabled) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
