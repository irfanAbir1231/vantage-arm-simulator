// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useEffect, useRef, useState } from "react";

type VerticalJogSliderProps = {
  disabled?: boolean;
  onJog: (deltaZ: number) => void;
  step: number;
};

const HEIGHT = 128;
const THUMB_SIZE = 26;
const MAX_TRAVEL = (HEIGHT - THUMB_SIZE) / 2;
const DEADZONE = 0.12;
const JOG_INTERVAL_MS = 140;

export function VerticalJogSlider({ disabled = false, onJog, step }: VerticalJogSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const draggingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(
    () => () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    },
    [],
  );

  function updateFromPointer(event: React.PointerEvent<HTMLDivElement>) {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const dy = Math.max(-MAX_TRAVEL, Math.min(MAX_TRAVEL, event.clientY - centerY));

    offsetRef.current = dy;
    setOffset(dy);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = true;
    setDragging(true);
    updateFromPointer(event);

    intervalRef.current = setInterval(() => {
      if (!draggingRef.current) {
        return;
      }

      const ny = offsetRef.current / MAX_TRAVEL;
      if (Math.abs(ny) < DEADZONE) {
        return;
      }

      onJog(-ny * step);
    }, JOG_INTERVAL_MS);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) {
      return;
    }

    updateFromPointer(event);
  }

  function endDrag() {
    draggingRef.current = false;
    setDragging(false);
    offsetRef.current = 0;
    setOffset(0);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[9px] text-slate-600">Z+</span>
      <div
        className={`relative w-8 rounded-full border border-slate-700 bg-slate-950 ${
          disabled ? "opacity-40" : ""
        }`}
        onPointerCancel={endDrag}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        ref={containerRef}
        style={{ height: HEIGHT, touchAction: "none" }}
      >
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-slate-800" />
        <div
          className={`pointer-events-none absolute left-1/2 rounded-full border-2 shadow-lg ${
            dragging ? "border-cyan-300 bg-cyan-500" : "border-cyan-700 bg-cyan-600"
          }`}
          style={{
            height: THUMB_SIZE,
            width: THUMB_SIZE,
            top: HEIGHT / 2 - THUMB_SIZE / 2 + offset,
            transform: "translateX(-50%)",
            transition: dragging ? "none" : "top 150ms ease-out",
          }}
        />
      </div>
      <span className="text-[9px] text-slate-600">Z-</span>
    </div>
  );
}
