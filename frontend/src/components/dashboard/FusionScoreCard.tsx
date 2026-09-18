import React from 'react';
import { useSessionStore } from '../../store/sessionStore';
import FloatingLines from '../fusion/FloatingLines';
import { ShieldCheck } from 'lucide-react';

export const FusionScoreCard: React.FC = () => {
  const fusion = useSessionStore((s) => s.fusion);

  const score = fusion ? fusion.truth_likelihood_pct : 74;
  const verdict = fusion?.verdict || 'LIKELY TRUTHFUL';

  const isTruthful = score >= 50;
  const activeColor = isTruthful ? '#00ff88' : '#ef4444';

  // Circular progress ring geometry (Sized appropriately to occupy the card space)
  const radius = 74;
  const stroke = 13;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      style={{
        background: '#001422',
        border: '1px solid rgba(0, 212, 255, 0.25)',
        borderRadius: 8,
        padding: '8px 14px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: 0,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
      }}
    >
      {/* ── Full Card Three.js Floating Lines Shader Background ─────── */}
      <FloatingLines
        key={isTruthful ? 'green-config' : 'red-config'}
        enabledWaves="middle,bottom,top"
        lineCount={8}
        lineDistance={8}
        bendRadius={8}
        bendStrength={-2}
        interactive={true}
        parallax={true}
        animationSpeed={1}
        gradientStart={isTruthful ? '#53f545' : '#f54545'}
        gradientMid={isTruthful ? '#1d8a17' : '#8a1717'}
        gradientEnd={isTruthful ? '#69a763' : '#a76363'}
      />

      {/* ── Clean Header (No Emoji / Icons) ─────────────────────────── */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 2,
          zIndex: 2,
          position: 'relative',
        }}
      >
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 800, color: '#F8FAFC' }}>
            Fusion Score
          </div>
          <div style={{ fontSize: 8.5, color: '#64748B', fontFamily: 'Space Grotesk' }}>
            Overall Truth Likelihood
          </div>
        </div>

        {/* Verdict Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            background: isTruthful ? 'rgba(0, 255, 136, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${isTruthful ? 'rgba(0, 255, 136, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
            padding: '2px 7px',
            borderRadius: 4,
            backdropFilter: 'blur(4px)',
          }}
        >
          <ShieldCheck size={10} color={activeColor} />
          <span style={{ fontSize: 8.5, fontWeight: 700, color: activeColor, fontFamily: 'Space Grotesk' }}>
            {verdict}
          </span>
        </div>
      </div>

      {/* ── Center: Generously Sized Circular Gauge (Filled with Black Core) ─ */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          width: '100%',
          minHeight: 0,
          zIndex: 2,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: radius * 2,
            height: radius * 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            borderRadius: '50%',
          }}
        >
          <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
            {/* Solid Black Interior Fill Circle */}
            <circle
              fill="#000000"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Dark Inactive Track */}
            <circle
              stroke="rgba(30, 41, 59, 0.85)"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Luminous Active Progress Arc */}
            <circle
              stroke={activeColor}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{
                strokeDashoffset,
                transition: 'stroke-dashoffset 0.8s ease-in-out',
                filter: `drop-shadow(0 0 12px ${activeColor})`,
              }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>

          {/* Large Central Percentage Value */}
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'Space Grotesk, JetBrains Mono, monospace',
                fontSize: 34,
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1,
                textShadow: `0 0 16px ${activeColor}80`,
              }}
            >
              {Math.round(score)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
