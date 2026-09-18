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
import { FileText } from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';

export const LinguisticSignalsCard: React.FC = () => {
  const linguisticSignalsHistory = useSessionStore((s) => s.linguisticSignalsHistory);

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
          <FileText size={12} color="#00d4ff" />
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, fontWeight: 800, color: '#F8FAFC' }}>
            Linguistic Signals
          </span>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 8, color: '#94a3b8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#00d4ff' }} />
            Consistency
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#3b82f6' }} />
            Fact
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#ef4444' }} />
            Contradict
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#f97316' }} />
            Uncertain
          </span>
        </div>
      </div>

      {/* ── Overlapping Multi-Area Signal Chart (No Dots, Linear) ───── */}
      <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={linguisticSignalsHistory} margin={{ top: 4, right: 6, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="consistencyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00d4ff" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="factMatchGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="contradictGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="uncertaintyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.0} />
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
            <Area type="linear" dataKey="consistency" stroke="#00d4ff" strokeWidth={1.5} fill="url(#consistencyGrad)" dot={false} isAnimationActive={false} />
            <Area type="linear" dataKey="factMatch" stroke="#3b82f6" strokeWidth={1.5} fill="url(#factMatchGrad)" dot={false} isAnimationActive={false} />
            <Area type="linear" dataKey="contradictions" stroke="#ef4444" strokeWidth={1.5} fill="url(#contradictGrad)" dot={false} isAnimationActive={false} />
            <Area type="linear" dataKey="uncertainty" stroke="#f97316" strokeWidth={1.5} fill="url(#uncertaintyGrad)" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
