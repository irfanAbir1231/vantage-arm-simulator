// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

"use client";

import { useEffect, useRef, useState } from "react";

type EditableAxisValueProps = {
  disabled?: boolean;
  onCommit: (value: number) => void;
  value: number;
};

export function EditableAxisValue({ disabled = false, onCommit, value }: EditableAxisValueProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.toFixed(3));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function startEdit(event: React.MouseEvent<HTMLSpanElement>) {
    event.preventDefault();

    if (disabled) {
      return;
    }

    setDraft(value.toFixed(3));
    setEditing(true);
  }

  function commit() {
    const parsed = Number.parseFloat(draft);

    if (Number.isFinite(parsed)) {
      onCommit(parsed);
    }

    setEditing(false);
  }

  function cancel() {
    setDraft(value.toFixed(3));
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        className="w-14 rounded border border-cyan-500 bg-slate-900 px-1 font-mono text-[11px] text-cyan-100 outline-none"
        inputMode="decimal"
        onBlur={cancel}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            cancel();
          }
        }}
        ref={inputRef}
        value={draft}
      />
    );
  }

  return (
    <span
      className={disabled ? "" : "cursor-context-menu decoration-dotted decoration-slate-500 hover:underline"}
      onContextMenu={startEdit}
      title={disabled ? undefined : "Right-click to edit, Enter to move here"}
    >
      {value.toFixed(3)}
    </span>
  );
}
