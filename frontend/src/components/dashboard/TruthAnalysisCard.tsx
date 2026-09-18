import React from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { Smile, Mic, FileText } from 'lucide-react';

interface ModalityGaugeProps {
  label: string;
  score: number;
  color: string;
  icon: React.ReactNode;
}

const ModalityGauge: React.FC<ModalityGaugeProps> = ({ label, score, color, icon }) => {
  const radius = 44;
  const stroke = 7.5;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {/* Circular Progress Arc */}
      <div style={{ position: 'relative', width: radius * 2, height: radius * 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
          {/* Background Track */}
          <circle
            stroke="rgba(30, 41, 59, 0.7)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Luminous Active Arc */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.8s ease-in-out',
              filter: `drop-shadow(0 0 8px ${color}90)`,
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        {/* Center Percentage */}
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: 'Space Grotesk, JetBrains Mono, monospace',
              fontSize: 18,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1,
            }}
          >
            {Math.round(score)}%
          </span>
        </div>
      </div>

      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
        <span style={{ color: color }}>{icon}</span>
        <span
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            color: '#cbd5e1',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};

export const TruthAnalysisCard: React.FC = () => {
  const face = useSessionStore((s) => s.face);
  const voice = useSessionStore((s) => s.voice);
  const text = useSessionStore((s) => s.text);
  const segmentElapsed = useSessionStore((s) => s.segmentElapsed);

  const faceScore = face?.face_score ?? 82;
  const voiceScore = voice ? 100 - voice.deception_score : 67;
  const textScore = text?.text_score ?? 81;

  const progressPct = (segmentElapsed / 10) * 100;

  return (
    <div
      style={{
        background: '#001422',
        border: '1px solid rgba(0, 212, 255, 0.25)',
        borderRadius: 8,
        padding: '8px 14px 6px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
        position: 'relative',
        overflow: 'hidden',
        justifyContent: 'space-between',
      }}
    >
      {/* ── Clean Header with Accurate 10s Countdown Timer ───────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 800, color: '#F8FAFC' }}>
            Truth Analysis
          </div>
          <div style={{ fontSize: 8.5, color: '#64748b', fontFamily: 'Space Grotesk' }}>
            Multi-modal AI Analysis
          </div>
        </div>

        {/* Accurate 10s Window Timer & Countdown Progress Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'rgba(0, 20, 34, 0.9)',
            border: '1px solid rgba(0, 212, 255, 0.35)',
            borderRadius: 4,
            padding: '2px 7px',
          }}
        >
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#00d4ff', animation: 'pulse-dot 1s infinite' }} />
          <span style={{ fontSize: 8.5, color: '#00d4ff', fontWeight: 700, fontFamily: 'Space Grotesk' }}>
            10s: {segmentElapsed.toString().padStart(2, '0')}s
          </span>
          <div style={{ width: 18, height: 3, background: 'rgba(51, 65, 85, 0.8)', borderRadius: 1.5, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                background: '#00d4ff',
                boxShadow: '0 0 4px #00d4ff',
                transition: 'width 0.9s linear',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── 3 Horizontal Circular Gauges (Clean, No Delta Increase) ────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flex: 1,
          padding: '6px 0',
        }}
      >
        <ModalityGauge
          label="Facial Truth"
          score={faceScore}
          color="#00d4ff"
          icon={<Smile size={12} />}
        />

        <ModalityGauge
          label="Vocal Truth"
          score={voiceScore}
          color="#3b82f6"
          icon={<Mic size={12} />}
        />

        <ModalityGauge
          label="Factual Truth"
          score={textScore}
          color="#8b5cf6"
          icon={<FileText size={12} />}
        />
      </div>
    </div>
  );
};
