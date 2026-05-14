interface Props {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function ToggleField({ label, description, value, onChange }: Props) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <label className="text-sm text-text-secondary">{label}</label>
        {description && (
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0 ${
          value ? "bg-primary" : "bg-white/10"
        }`}
        role="switch"
        aria-checked={value}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-sm ${
            value ? "left-[18px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
