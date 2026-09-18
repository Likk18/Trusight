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
import { Mic } from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';

export const VocalSignalsCard: React.FC = () => {
  const vocalSignalsHistory = useSessionStore((s) => s.vocalSignalsHistory);

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

      {/* ── Overlapping Multi-Area Signal Chart (No Dots, Linear) ───── */}
      <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={vocalSignalsHistory} margin={{ top: 4, right: 6, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="hesitationGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="speechRateGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ff88" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00ff88" stopOpacity={0.0} />
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
            <Area type="linear" dataKey="pitch" stroke="#3b82f6" strokeWidth={1.5} fill="url(#pitchGrad)" dot={false} isAnimationActive={false} />
            <Area type="linear" dataKey="hesitation" stroke="#f97316" strokeWidth={1.5} fill="url(#hesitationGrad)" dot={false} isAnimationActive={false} />
            <Area type="linear" dataKey="energy" stroke="#8b5cf6" strokeWidth={1.5} fill="url(#energyGrad)" dot={false} isAnimationActive={false} />
            <Area type="linear" dataKey="speechRate" stroke="#00ff88" strokeWidth={1.5} fill="url(#speechRateGrad)" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
