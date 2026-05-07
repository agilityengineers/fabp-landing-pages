"use client";
import { useState } from "react";
import { PlaybookForm } from "./PlaybookForm";

interface PlaybookButtonProps {
  industrySlug: string;
  label: string;
  turnstileSiteKey: string | null;
}

export function PlaybookButton({
  industrySlug,
  label,
  turnstileSiteKey,
}: PlaybookButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-lg"
        onClick={() => setOpen(true)}
      >
        ↓ {label}
      </button>
      {open && (
        <PlaybookForm
          industrySlug={industrySlug}
          turnstileSiteKey={turnstileSiteKey}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
