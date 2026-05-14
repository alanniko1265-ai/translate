interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorField({ label, value, onChange }: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-text-secondary">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg border-2 border-white/10 cursor-pointer bg-transparent p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-44 input-field text-xs py-1.5"
          placeholder="rgba(99,102,241,0.15)"
        />
      </div>
    </div>
  );
}
