import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Smile } from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';

export const FacialSignalsCard: React.FC = () => {
  const face = useSessionStore((s) => s.face);

  const eyeContact = face ? face.metrics.eye_contact_pct / 100 : 0.82;
  const blinkRate = face?.metrics.blink_rate_status === 'Normal' ? 0.45 : 0.75;
  const headStability = face ? face.metrics.head_stability_pct / 100 : 0.88;
  const tension = face ? face.metrics.facial_tension_pct / 100 : 0.22;

  const data = Array.from({ length: 12 }, (_, i) => ({
    time: `0${Math.floor(i * 1.2)}:00`,
    eyeContact: Math.min(1, Math.max(0.1, eyeContact + Math.sin(i * 0.7) * 0.08)),
    blinkRate: Math.min(1, Math.max(0.1, blinkRate + Math.cos(i * 0.8) * 0.1)),
    headStability: Math.min(1, Math.max(0.1, headStability + Math.sin(i * 0.5) * 0.06)),
    facialTension: Math.min(1, Math.max(0.05, tension + Math.cos(i * 0.9) * 0.07)),
  }));

  return (
    <div
      style={{
        background: '#001422',
        border: '1px solid rgba(0, 212, 255, 0.25)',
        borderRadius: 8,
        padding: '6px 10px 4px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
      }}
    >
      {/* ── Header & Legend ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Smile size={12} color="#00d4ff" />
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, fontWeight: 800, color: '#F8FAFC' }}>
            Facial Signals
          </span>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 8, color: '#94a3b8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#00ff88' }} />
            Eye Contact
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#f59e0b' }} />
            Blink
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#00d4ff' }} />
            Head
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#8b5cf6' }} />
            Tension
          </span>
        </div>
      </div>

      {/* ── Multi-Line Signal Chart (Full Coverage) ──────────────────── */}
      <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 6, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.4)" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
            <YAxis
              domain={[0, 1]}
              ticks={[0.0, 0.5, 1.0]}
              stroke="#64748b"
              fontSize={8}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <Tooltip
              contentStyle={{ background: '#091522', border: '1px solid rgba(0, 212, 255, 0.4)', borderRadius: 6, fontSize: 9 }}
            />
            <ReferenceLine
              y={0.5}
              stroke="rgba(255, 255, 255, 0.6)"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{ value: 'Threshold (0.5)', position: 'insideBottomRight', fill: '#64748b', fontSize: 7.5 }}
            />
            <Line type="monotone" dataKey="eyeContact" stroke="#00ff88" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="blinkRate" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="headStability" stroke="#00d4ff" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="facialTension" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
