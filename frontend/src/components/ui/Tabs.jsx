export default function Tabs({ tabs, activeKey, onChange }) {
  return (
    <div className="flex gap-1 border-b border-[#1e293b]" role="tablist">
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              active
                ? 'text-[#2dd4a8]'
                : 'text-[#8b949e] hover:text-[#e6edf3]'
            }`}
          >
            {tab.label}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2dd4a8] rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
