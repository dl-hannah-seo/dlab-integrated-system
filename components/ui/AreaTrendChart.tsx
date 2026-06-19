'use client';

import { useEffect, useId, useState } from 'react';

export interface TrendSeries {
  values: (number | null)[];
  color: string;
  /** 영역(그라데이션) 채움 여부 — 보통 메인 시리즈만 true */
  fill?: boolean;
  /** 점선 처리(예: 전년 동기 비교) */
  dashed?: boolean;
}

interface AreaTrendChartProps {
  series: TrendSeries[];
  labels: string[];
  height?: number;
  /** 강조할 x 인덱스(현재 시점 등) */
  currentIdx?: number;
  className?: string;
}

const W = 600;
const PAD_T = 18;
const PAD_B = 14;

/** Catmull-Rom → 베지어 변환으로 부드러운 곡선 path 생성 (Earning Summary 톤) */
export function smoothLinePath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/** 부드러운 곡선 + 블루 그라데이션 영역 + 등장 애니메이션을 갖춘 추이 차트 */
export function AreaTrendChart({ series, labels, height = 200, currentIdx, className = '' }: AreaTrendChartProps) {
  const uid = useId().replace(/:/g, '');
  const [play, setPlay] = useState(false);

  // 마운트 직후 한 프레임 뒤 애니메이션 트리거 (CSS 미디어쿼리 영향 없이 항상 재생)
  useEffect(() => {
    const r = requestAnimationFrame(() => setPlay(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const n = labels.length;
  const innerH = height - PAD_T - PAD_B;

  const allVals = series.flatMap(s => s.values.filter((v): v is number => v != null));
  const rawMax = allVals.length ? Math.max(...allVals) : 1;
  const rawMin = allVals.length ? Math.min(...allVals) : 0;
  const pad = (rawMax - rawMin || 1) * 0.22;        // 도메인 여백 — 곡선이 위아래 끝에 붙지 않도록
  const lo = rawMin - pad;
  const hi = rawMax + pad;
  const dom = hi - lo || 1;

  const xAt = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const yAt = (v: number) => PAD_T + innerH - ((v - lo) / dom) * innerH;

  const built = series.map(s => {
    const pts = s.values
      .map((v, i) => (v == null ? null : { x: xAt(i), y: yAt(v) }))
      .filter((p): p is { x: number; y: number } => p != null);
    return { ...s, pts };
  });

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          {built.map((s, si) =>
            s.fill ? (
              <linearGradient key={si} id={`${uid}-g${si}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ) : null,
          )}
        </defs>

        {built.map((s, si) => {
          if (s.pts.length === 0) return null;
          const line = smoothLinePath(s.pts);
          const last = s.pts[s.pts.length - 1];
          const first = s.pts[0];
          const area = `${line} L ${last.x.toFixed(2)} ${height} L ${first.x.toFixed(2)} ${height} Z`;
          return (
            <g key={si}>
              {s.fill && (
                <path
                  d={area}
                  fill={`url(#${uid}-g${si})`}
                  style={{
                    transformBox: 'fill-box',
                    transformOrigin: 'bottom',
                    opacity: play ? 1 : 0,
                    transform: play ? 'scaleY(1)' : 'scaleY(0.5)',
                    transition: 'opacity 1.1s ease, transform 1.1s cubic-bezier(0.45,0,0.25,1)',
                  }}
                />
              )}
              <path
                d={line}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={s.dashed ? '5 5' : 1}
                pathLength={1}
                style={
                  s.dashed
                    ? { opacity: play ? 1 : 0, transition: 'opacity 0.9s ease 0.3s' }
                    : { strokeDashoffset: play ? 0 : 1, transition: 'stroke-dashoffset 1.15s cubic-bezier(0.45,0,0.25,1)' }
                }
              />
            </g>
          );
        })}

        {/* 데이터 점 (현재 시점 강조) — 채움 시리즈만 표기 */}
        {built.map((s, si) =>
          s.fill
            ? s.pts.map((p, i) => (
                <circle
                  key={`${si}-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={i === currentIdx ? 4.5 : 3}
                  fill={s.color}
                  stroke="#fff"
                  strokeWidth={1.5}
                  style={{
                    opacity: play ? 1 : 0,
                    transition: `opacity 0.4s ease ${0.5 + i * 0.09}s`,
                  }}
                />
              ))
            : null,
        )}
      </svg>

      <div className="mt-1.5 flex justify-between">
        {labels.map((l, i) => (
          <span
            key={l + i}
            className={`flex-1 text-center text-xs ${i === currentIdx ? 'font-semibold text-[#2F6BFF]' : 'text-[#6B7280]'}`}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
