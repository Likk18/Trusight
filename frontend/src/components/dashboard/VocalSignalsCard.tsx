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
import { Mic } from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';

export const VocalSignalsCard: React.FC = () => {
  const voice = useSessionStore((s) => s.voice);

  const pitch = voice?.metrics.pitch_status === 'Normal' ? 0.82 : 0.48;
  const hesitation = voice?.metrics.hesitation_level === 'Low' ? 0.22 : 0.65;
  const energy = voice ? voice.metrics.energy_pct / 100 : 0.72;
  const speechRate = voice ? Math.min(1, voice.metrics.speech_rate_wpm / 200) : 0.68;

  const data = Array.from({ length: 12 }, (_, i) => ({
    time: `0${Math.floor(i * 1.2)}:00`,
    pitch: Math.min(1, Math.max(0.1, pitch + Math.sin(i * 0.6) * 0.08)),
    hesitation: Math.min(1, Math.max(0.05, hesitation + Math.cos(i * 0.7) * 0.09)),
    energy: Math.min(1, Math.max(0.1, energy + Math.sin(i * 0.4) * 0.07)),
    speechRate: Math.min(1, Math.max(0.1, speechRate + Math.cos(i * 0.5) * 0.08)),
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
          <Mic size={12} color="#00d4ff" />
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, fontWeight: 800, color: '#F8FAFC' }}>
            Vocal Signals
          </span>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 8, color: '#94a3b8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#3b82f6' }} />
            Pitch
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#f97316' }} />
            Hesitation
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#8b5cf6' }} />
            Energy
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#00ff88' }} />
            Rate
          </span>
        </div>
      </div>

      {/* ── Multi-Line Signal Chart ──────────────────────────────────── */}
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
            <Line type="monotone" dataKey="pitch" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="hesitation" stroke="#f97316" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="energy" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="speechRate" stroke="#00ff88" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
