// Small trend line. Decorative (aria-hidden) - callers show the numbers.
export default function Sparkline({ values, width = 56, height = 24 }: { values: number[]; width?: number; height?: number }) {
  // Yahoo leaves null for bars still forming; plotting them as 0 draws a cliff.
  const points = values.filter((v) => Number.isFinite(v));
  if (points.length < 2) return <span className="inline-block" style={{ width }} />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const path = points
    .map((v, i) => `${(i / (points.length - 1)) * width},${height - 2 - ((v - min) / span) * (height - 4)}`)
    .join(" ");
  const up = points[points.length - 1] >= points[0];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="shrink-0">
      <polyline
        points={path}
        fill="none"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        className={up ? "stroke-teal-600" : "stroke-red-600 dark:stroke-red-500"}
      />
    </svg>
  );
}
