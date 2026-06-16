export interface DonutSlice {
  label: string;
  /** SVG 그리기에 사용 (항상 양수) */
  amount: number;
  /** 범례에 표시할 금액 (음수 허용, 미지정 시 amount 사용) */
  displayAmount?: number;
  color: string;
  badge?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, R: number, r: number, start: number, end: number) {
  const large = end - start > 180 ? 1 : 0;
  const s1 = polarToCartesian(cx, cy, R, start);
  const e1 = polarToCartesian(cx, cy, R, end);
  const s2 = polarToCartesian(cx, cy, r, end);
  const e2 = polarToCartesian(cx, cy, r, start);
  return `M ${s1.x} ${s1.y} A ${R} ${R} 0 ${large} 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${r} ${r} 0 ${large} 0 ${e2.x} ${e2.y} Z`;
}

export function DonutChart({
  slices,
  size = 140,
  showAmounts = false,
}: {
  slices: DonutSlice[];
  size?: number;
  showAmounts?: boolean;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 6;
  const r = R * 0.58;
  const total = slices.reduce((s, i) => s + i.amount, 0);

  if (total === 0) return null;

  let angle = 0;
  const paths = slices.map(slice => {
    const sweep = (slice.amount / total) * 360;
    const path = slicePath(cx, cy, R, r, angle, angle + sweep - 0.5);
    angle += sweep;
    return { ...slice, path };
  });

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} className="shrink-0">
        {paths.map(p => (
          <path key={p.label} d={p.path} fill={p.color} />
        ))}
      </svg>
      <div className="space-y-2.5 min-w-0 flex-1">
        {slices.map(slice => {
          const pct = Math.round((slice.amount / total) * 100);
          const display = slice.displayAmount ?? slice.amount;
          return (
            <div key={slice.label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
              <span className="text-sm text-[#37352F] truncate flex items-center gap-1.5">
                {slice.label}
                {slice.badge && (
                  <span className="text-[10px] font-semibold text-[#FF6C37] bg-[#FFF1EC] px-1.5 py-0.5 rounded">
                    {slice.badge}
                  </span>
                )}
              </span>
              <span className="ml-auto text-sm font-medium tabular-nums text-[#37352F] pl-2 shrink-0">
                {showAmounts
                  ? display.toLocaleString('ko-KR') + '원'
                  : pct + '%'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
