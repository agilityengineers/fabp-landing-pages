"use client";

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function ToggleSwitch({ label, checked, onChange }: ToggleSwitchProps) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`toggle-sw${checked ? " on" : ""}`}
        onClick={() => onChange(!checked)}
        type="button"
      />
    </div>
  );
}
