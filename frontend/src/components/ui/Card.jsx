export default function Card({ children, hover = false, className = '', ...props }) {
  return (
    <div
      className={`bg-[#161b22] border border-[#1e293b] rounded-lg p-4 ${
        hover ? 'transition-shadow hover:glow-accent' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
