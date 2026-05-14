interface Props {
  label: string;
  description?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function SelectField({ label, description, value, options, onChange }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm text-text-secondary shrink-0">{label}</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none cursor-pointer hover:border-white/20 transition-colors appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 8px center",
            paddingRight: "28px",
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#1E293B]">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {description && (
        <p className="text-[11px] text-text-muted/60 mt-1">{description}</p>
      )}
    </div>
  );
}
