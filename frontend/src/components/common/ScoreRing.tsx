import React from 'react';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  fontSize?: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 80,
  strokeWidth = 6,
  color = '#00d4ff',
  trackColor = 'rgba(255,255,255,0.06)',
  label,
  sublabel,
  fontSize = 18,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const dashOffset = circumference * (1 - clampedScore / 100);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 6px ${color}80)`,
          }}
        />
      </svg>
      {/* Center text */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          lineHeight: 1.1,
        }}
      >
        <div
          style={{
            fontSize: fontSize,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: color,
            textShadow: `0 0 10px ${color}80`,
          }}
        >
          {Math.round(clampedScore)}%
        </div>
        {label && (
          <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginTop: 1 }}>
            {label}
          </div>
        )}
        {sublabel && (
          <div style={{ fontSize: 8, color: '#475569' }}>{sublabel}</div>
        )}
      </div>
    </div>
  );
};
