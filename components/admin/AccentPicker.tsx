"use client";

const ACCENTS = [
  { k: "navy", c: "#0b2a47" },
  { k: "midnight", c: "#0a1f33" },
  { k: "ink", c: "#0e0d0b" },
  { k: "forest", c: "#1f3a26" },
] as const;

interface AccentPickerProps {
  value: string;
  onChange: (v: string) => void;
}

export function AccentPicker({ value, onChange }: AccentPickerProps) {
  return (
    <div className="accent-pick">
      {ACCENTS.map((a) => (
        <button
          key={a.k}
          className={value === a.k ? "on" : ""}
          style={{ background: a.c }}
          onClick={() => onChange(a.k)}
          aria-label={a.k}
          title={a.k}
          type="button"
        />
      ))}
    </div>
  );
}
