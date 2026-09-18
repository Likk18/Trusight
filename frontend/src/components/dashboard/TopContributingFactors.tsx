import React from 'react';
import { ChevronDown } from 'lucide-react';

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
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
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
        <button
          onClick={() => {}} // Placeholder for potential expand/collapse functionality
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            padding: 0,
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {/* ── Factors List ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FACTORS.map((factor, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Factor Name */}
            <span
              style={{
                width: '40%',
                fontSize: 12,
                color: '#94a3b8',
                fontFamily: 'Space Grotesk, sans-serif',
              }}
            >
              {factor.name}
            </span>

            {/* Progress Bar Container */}
            <div
              style={{
                flex: 1,
                height: 6,
                background: 'rgba(0, 20, 34, 0.5)',
                borderRadius: 3,
                overflow: 'hidden',
                margin: '0 10px',
              }}
            >
              <div
                style={{
                  width: `${factor.percentage}%`,
                  height: '100%',
                  background: factor.color,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            {/* Percentage Value */}
            <span
              style={{
                width: '20%',
                textAlign: 'right',
                fontSize: 12,
                color: factor.isPositive ? '#00ff88' : '#ef4444',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 600,
              }}
            >
              {factor.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};