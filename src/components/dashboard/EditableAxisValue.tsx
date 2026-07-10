// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

"use client";

import { useEffect, useRef } from "react";

type EditableAxisValueProps = {
  disabled?: boolean;
  /** Editing draft text; null renders the live value and waits for a click. */
  draft: string | null;
  onBeginEdit: () => void;
  onCancel: () => void;
  onDraftChange: (draft: string) => void;
  onSubmit: () => void;
  value: number;
};

export function EditableAxisValue({
  disabled = false,
  draft,
  onBeginEdit,
  onCancel,
  onDraftChange,
  onSubmit,
  value,
}: EditableAxisValueProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const editing = draft !== null;

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  if (editing) {
    return (
      <input
        className="w-14 rounded border border-cyan-500 bg-slate-900 px-1 font-mono text-[11px] text-cyan-100 outline-none"
        inputMode="decimal"
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
        ref={inputRef}
        value={draft}
      />
    );
  }

  return (
    <span
      className={
        disabled
          ? ""
          : "cursor-pointer decoration-dotted decoration-slate-500 hover:underline"
      }
      onClick={() => {
        if (!disabled) {
          onBeginEdit();
        }
      }}
      title={disabled ? undefined : "Click to edit, then press Save changes"}
    >
      {value.toFixed(3)}
    </span>
  );
}
