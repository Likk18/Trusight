import React from 'react';

interface ArcGaugeProps {
  score: number;
  size?: number;
}

export const ArcGauge: React.FC<ArcGaugeProps> = ({ score, size = 260 }) => {
  const clampedScore = Math.min(100, Math.max(0, score));

  // Arc from -210° to +30° (240° sweep), centered at top
  const cx = size / 2;
  const cy = size / 2 + 10;
  const radius = size / 2 - 24;
  const startAngle = -210; // degrees
  const sweepAngle = 240;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcPath = (startDeg: number, endDeg: number, r: number) => {
    const s = toRad(startDeg);
    const e = toRad(endDeg);
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  // Score angle
  const scoreAngle = startAngle + (clampedScore / 100) * sweepAngle;

  // Needle tip
  const needleLength = radius - 8;
  const needleAngle = toRad(scoreAngle);
  const nx = cx + needleLength * Math.cos(needleAngle);
  const ny = cy + needleLength * Math.sin(needleAngle);

  // Color gradient stops along the arc
  const getScoreColor = (s: number) => {
    if (s >= 75) return '#00ff88';
    if (s >= 50) return '#f59e0b';
    return '#ef4444';
  };
  const scoreColor = getScoreColor(clampedScore);

  return (
    <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size * 0.75}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="35%" stopColor="#f59e0b" />
          <stop offset="65%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#00ff88" />
        </linearGradient>
        <filter id="arc-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Track arc */}
      <path
        d={arcPath(startAngle, startAngle + sweepAngle, radius)}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={14}
        strokeLinecap="round"
      />

      {/* Colored arc (gradient) */}
      <path
        d={arcPath(startAngle, scoreAngle, radius)}
        fill="none"
        stroke="url(#arc-gradient)"
        strokeWidth={14}
        strokeLinecap="round"
        filter="url(#arc-glow)"
        style={{ transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />

      {/* Tick marks */}
      {[0, 25, 50, 75, 100].map((tick) => {
        const tickAngle = toRad(startAngle + (tick / 100) * sweepAngle);
        const innerR = radius - 10;
        const outerR = radius + 4;
        return (
          <g key={tick}>
            <line
              x1={cx + innerR * Math.cos(tickAngle)}
              y1={cy + innerR * Math.sin(tickAngle)}
              x2={cx + outerR * Math.cos(tickAngle)}
              y2={cy + outerR * Math.sin(tickAngle)}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1.5}
            />
            <text
              x={cx + (outerR + 12) * Math.cos(tickAngle)}
              y={cy + (outerR + 12) * Math.sin(tickAngle)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fill="#475569"
              fontFamily="JetBrains Mono, monospace"
            >
              {tick}
            </text>
          </g>
        );
      })}

      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke={scoreColor}
        strokeWidth={2.5}
        strokeLinecap="round"
        style={{ transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 4px ${scoreColor})` }}
      />
      <circle cx={cx} cy={cy} r={7} fill={scoreColor} style={{ filter: `drop-shadow(0 0 8px ${scoreColor})` }} />
    </svg>
  );
};
