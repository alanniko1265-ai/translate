import { Keyboard, X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { normalizeShortcut } from "../../services/translation/workflow";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MODIFIER_KEYS = new Set([
  "Alt",
  "AltGraph",
  "Control",
  "Meta",
  "Shift",
  "Super",
]);

const CODE_ALIASES: Record<string, string> = {
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  ArrowUp: "Up",
  Backquote: "Backquote",
  Backslash: "Backslash",
  BracketLeft: "BracketLeft",
  BracketRight: "BracketRight",
  Comma: "Comma",
  Equal: "Equal",
  Minus: "Minus",
  Period: "Period",
  Quote: "Quote",
  Semicolon: "Semicolon",
  Slash: "Slash",
};

const KEY_ALIASES: Record<string, string> = {
  " ": "Space",
  Esc: "Escape",
  Del: "Delete",
  OS: "Super",
};

export function ShortcutField({ label, value, onChange, placeholder }: Props) {
  const [recording, setRecording] = useState(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const hasModifier = event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;
    if ((event.key === "Backspace" || event.key === "Delete") && !hasModifier) {
      onChange("");
      setRecording(false);
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Escape" && !hasModifier) {
      setRecording(false);
      event.currentTarget.blur();
      return;
    }

    const mainKey = normalizeMainKey(event);
    if (!mainKey) return;

    const parts: string[] = [];
    if (event.ctrlKey) parts.push("Control");
    if (event.shiftKey) parts.push("Shift");
    if (event.altKey) parts.push("Alt");
    if (event.metaKey) parts.push("Super");
    parts.push(mainKey);

    onChange(normalizeShortcut(parts.join("+")));
    setRecording(false);
    event.currentTarget.blur();
  };

  return (
    <div>
      <label className="text-sm text-text-secondary block mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Keyboard
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          readOnly
          value={recording ? "" : value}
          onFocus={() => setRecording(true)}
          onClick={() => setRecording(true)}
          onBlur={() => setRecording(false)}
          onKeyDown={handleKeyDown}
          placeholder={recording ? "Press keys" : placeholder}
          className="input-field pl-9 pr-9"
        />
        {value && (
          <button
            type="button"
            title="Clear"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function normalizeMainKey(event: KeyboardEvent<HTMLInputElement>) {
  if (MODIFIER_KEYS.has(event.key)) return null;

  if (/^Key[A-Z]$/.test(event.code)) {
    return event.code.replace("Key", "");
  }

  if (/^Digit[0-9]$/.test(event.code)) {
    return event.code.replace("Digit", "");
  }

  if (/^Numpad/.test(event.code)) {
    return event.code;
  }

  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(event.key)) {
    return event.key.toUpperCase();
  }

  if (CODE_ALIASES[event.code]) {
    return CODE_ALIASES[event.code];
  }

  if (KEY_ALIASES[event.key]) {
    return KEY_ALIASES[event.key];
  }

  if (event.key.length === 1) {
    return event.key.toUpperCase();
  }

  return event.key;
}
