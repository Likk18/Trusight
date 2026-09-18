import React from 'react';
import { motion } from 'framer-motion';

interface FactorItem {
  name: string;
  percentage: number;
  isPositive: boolean;
  color: string;
}

const FACTORS: FactorItem[] = [
  { name: 'Linguistic Consistency', percentage: 28, isPositive: true, color: '#00ff88' },
  { name: 'Speech Patterns', percentage: 24, isPositive: true, color: '#00d4ff' },
  { name: 'Facial Stability', percentage: 20, isPositive: true, color: '#8b5cf6' },
  { name: 'Factual Evidence', percentage: 18, isPositive: true, color: '#f97316' },
  { name: 'Minor Hesitation', percentage: 6, isPositive: false, color: '#ef4444' },
];

export const TopContributingFactors: React.FC = () => {
  return (
    <div
      style={{
        background: '#001422',
        border: '1px solid rgba(0, 212, 255, 0.25)',
        borderRadius: 8,
        padding: '6px 12px 6px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
        justifyContent: 'space-between',
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#00d4ff', fontSize: 12, fontWeight: 900 }}>▥</span>
          <span
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 13,
              fontWeight: 800,
              color: '#F8FAFC',
              letterSpacing: '0.02em',
            }}
          >
            Top Contributing Factors
          </span>
        </div>

        <button
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: 9.5,
            fontWeight: 700,
            fontFamily: 'Space Grotesk, sans-serif',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#00d4ff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
        >
          View Details →
        </button>
      </div>

      {/* ── 5 Factor Progress Rows (Edge-to-Edge Expansion) ──────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, justifyContent: 'space-around' }}>
        {FACTORS.map((factor) => {
          // Normalize bar width relative to max 30%
          const barWidth = Math.min(100, (factor.percentage / 30) * 100);

          return (
            <div key={factor.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Factor Name */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#cbd5e1',
                  width: 135,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {factor.name}
              </span>

              {/* Progress Track */}
              <div
                style={{
                  flex: 1,
                  height: 7,
                  background: 'rgba(30, 41, 59, 0.6)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    borderRadius: 4,
                    background: factor.isPositive
                      ? `linear-gradient(90deg, ${factor.color}60, ${factor.color})`
                      : 'linear-gradient(90deg, #ef4444, #dc2626)',
                    boxShadow: `0 0 8px ${factor.color}40`,
                  }}
                />
              </div>

              {/* Percentage Value */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: factor.isPositive ? factor.color : '#ef4444',
                  width: 34,
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {factor.isPositive ? `+${factor.percentage}%` : `-${factor.percentage}%`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
