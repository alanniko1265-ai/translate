interface Props {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function SliderField({
  label,
  description,
  value,
  min,
  max,
  step,
  unit = "",
  onChange,
}: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-text-secondary">{label}</label>
        <span className="text-xs text-text-muted tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      {description && (
        <p className="text-[11px] text-text-muted/60 mb-2">{description}</p>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #6366F1 0%, #6366F1 ${
            ((value - min) / (max - min)) * 100
          }%, rgba(255,255,255,0.1) ${
            ((value - min) / (max - min)) * 100
          }%, rgba(255,255,255,0.1) 100%)`,
          accentColor: "#6366F1",
        }}
      />
    </div>
  );
}
