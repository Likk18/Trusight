import React from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { Activity, Smile, Mic, FileText } from 'lucide-react';

interface ModalityGaugeProps {
  label: string;
  score: number;
  delta: number;
  color: string;
  icon: React.ReactNode;
}

const ModalityGauge: React.FC<ModalityGaugeProps> = ({ label, score, delta, color, icon }) => {
  const radius = 44;
  const stroke = 7.5;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
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
            fontSize: 10.5,
            fontWeight: 700,
            color: '#cbd5e1',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </div>

      {/* Delta Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          fontSize: 9,
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 700,
          color: '#00ff88',
        }}
      >
        <span>△</span>
        <span>{delta}%</span>
      </div>
    </div>
  );
};

export const TruthAnalysisCard: React.FC = () => {
  const face = useSessionStore((s) => s.face);
  const voice = useSessionStore((s) => s.voice);
  const text = useSessionStore((s) => s.text);

  const faceScore = face?.face_score ?? 82;
  const voiceScore = voice ? 100 - voice.deception_score : 67;
  const textScore = text?.text_score ?? 81;

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
      {/* ── Clean Header (No Emoji / Icons) ──────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 800, color: '#F8FAFC' }}>
            Truth Analysis
          </div>
          <div style={{ fontSize: 8.5, color: '#64748b', fontFamily: 'Space Grotesk' }}>
            Multi-modal AI Analysis
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.25)', borderRadius: 4, padding: '2px 6px' }}>
          <Activity size={10} color="#00d4ff" />
          <span style={{ fontSize: 8, color: '#00d4ff', fontWeight: 600, fontFamily: 'Space Grotesk' }}>
            Analyzing in real-time
          </span>
        </div>
      </div>

      {/* ── 3 Horizontal Circular Gauges (Slightly Bigger & Filling Space) ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flex: 1,
          padding: '4px 0',
        }}
      >
        <ModalityGauge
          label="Facial Truth"
          score={faceScore}
          delta={12}
          color="#00d4ff"
          icon={<Smile size={11} />}
        />

        <ModalityGauge
          label="Vocal Truth"
          score={voiceScore}
          delta={8}
          color="#3b82f6"
          icon={<Mic size={11} />}
        />

        <ModalityGauge
          label="Factual Truth"
          score={textScore}
          delta={15}
          color="#8b5cf6"
          icon={<FileText size={11} />}
        />
      </div>
    </div>
  );
};
