interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "password";
  placeholder?: string;
}

export function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: Props) {
  return (
    <div>
      <label className="text-sm text-text-secondary block mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );
}
