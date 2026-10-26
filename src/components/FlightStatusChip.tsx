'use client';

import { useEffect, useRef, useState } from 'react';
import { Plane, RefreshCw } from 'lucide-react';

/** Compact "m:ss" rendering; falls back to an em dash when there is no value. */
function fmtMs(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return '—';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function FlightStatusChip({
  dataTimestamp,
  nextRefreshAt,
  onRefresh,
  refreshing = false,
}: {
  dataTimestamp: string | null;
  nextRefreshAt: number | null;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const ageMs = dataTimestamp ? now - Date.parse(dataTimestamp) : null;
  const nextMs = nextRefreshAt !== null ? nextRefreshAt - now : null;

  return (
    <div
      className="pointer-events-auto flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1.5 backdrop-blur-md font-mono text-[11px] text-white/80 shadow-lg"
      style={{ minWidth: 150 }}
    >
      <Plane className="h-3.5 w-3.5 flex-shrink-0 text-[var(--cyan-primary)]" />
      <span className="tabular-nums">
        {fmtMs(ageMs)} <span className="text-white/30">~</span> {fmtMs(nextMs)}
      </span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing || !onRefresh}
        aria-label="Refresh flight data"
        className="ml-auto flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-white/10 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
      >
        <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
