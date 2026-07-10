// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useEffect, useRef, useState } from "react";

type Vector2 = { x: number; y: number };

type DragJoystickProps = {
  disabled?: boolean;
  onJog: (delta: Vector2) => void;
  step: number;
};

const SIZE = 128;
const KNOB_SIZE = 40;
const MAX_TRAVEL = (SIZE - KNOB_SIZE) / 2;
const DEADZONE = 0.12;
const JOG_INTERVAL_MS = 140;

export function DragJoystick({ disabled = false, onJog, step }: DragJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef<Vector2>({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [offset, setOffset] = useState<Vector2>({ x: 0, y: 0 });
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
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;
    const length = Math.hypot(dx, dy);

    if (length > MAX_TRAVEL) {
      const scale = MAX_TRAVEL / length;
      dx *= scale;
      dy *= scale;
    }

    offsetRef.current = { x: dx, y: dy };
    setOffset({ x: dx, y: dy });
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

      const { x, y } = offsetRef.current;
      const nx = x / MAX_TRAVEL;
      const ny = y / MAX_TRAVEL;

      if (Math.hypot(nx, ny) < DEADZONE) {
        return;
      }

      onJog({ x: nx * step, y: -ny * step });
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
    offsetRef.current = { x: 0, y: 0 };
    setOffset({ x: 0, y: 0 });

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ height: SIZE, width: SIZE }}>
        <span className="absolute left-1/2 top-0.5 -translate-x-1/2 text-[9px] text-slate-600">
          Y+
        </span>
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] text-slate-600">
          Y-
        </span>
        <span className="absolute left-0.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-600">
          X-
        </span>
        <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-600">
          X+
        </span>
        <div
          className={`absolute inset-0 rounded-full border border-slate-700 bg-slate-950 ${
            disabled ? "opacity-40" : ""
          }`}
          onPointerCancel={endDrag}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          ref={containerRef}
          style={{ touchAction: "none" }}
        >
          <div className="pointer-events-none absolute inset-3 rounded-full border border-slate-800" />
          <div
            className={`pointer-events-none absolute rounded-full border-2 shadow-lg ${
              dragging ? "border-cyan-300 bg-cyan-500" : "border-cyan-700 bg-cyan-600"
            }`}
            style={{
              height: KNOB_SIZE,
              width: KNOB_SIZE,
              left: SIZE / 2 - KNOB_SIZE / 2 + offset.x,
              top: SIZE / 2 - KNOB_SIZE / 2 + offset.y,
              transition: dragging ? "none" : "left 150ms ease-out, top 150ms ease-out",
            }}
          />
        </div>
      </div>
    </div>
  );
}
