import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Smile } from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';

export const FacialSignalsCard: React.FC = () => {
  const facialSignalsHistory = useSessionStore((s) => s.facialSignalsHistory);

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

      {/* ── Overlapping Multi-Area Signal Chart (No Dots, Linear) ───── */}
      <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={facialSignalsHistory} margin={{ top: 4, right: 6, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="eyeContactGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ff88" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00ff88" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="blinkRateGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="headStabGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00d4ff" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="tensionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.4)" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
            <YAxis
              domain={[0, 1]}
              ticks={[0.0, 0.5, 1.0]}
              stroke="#64748b"
              fontSize={8}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <Tooltip
              formatter={(value: any, name: any) => [`${Number(value).toFixed(2)}`, name]}
              labelFormatter={(label) => `Time: ${label}`}
              contentStyle={{ background: '#091522', border: '1px solid rgba(0, 212, 255, 0.4)', borderRadius: 6, fontSize: 9 }}
            />
            <ReferenceLine
              y={0.5}
              stroke="rgba(255, 255, 255, 0.6)"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{ value: 'Threshold (0.50)', position: 'insideBottomRight', fill: '#64748b', fontSize: 7.5 }}
            />
            <Area type="linear" dataKey="eyeContact" stroke="#00ff88" strokeWidth={1.5} fill="url(#eyeContactGrad)" dot={false} isAnimationActive={false} />
            <Area type="linear" dataKey="blinkRate" stroke="#f59e0b" strokeWidth={1.5} fill="url(#blinkRateGrad)" dot={false} isAnimationActive={false} />
            <Area type="linear" dataKey="headStability" stroke="#00d4ff" strokeWidth={1.5} fill="url(#headStabGrad)" dot={false} isAnimationActive={false} />
            <Area type="linear" dataKey="facialTension" stroke="#8b5cf6" strokeWidth={1.5} fill="url(#tensionGrad)" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
