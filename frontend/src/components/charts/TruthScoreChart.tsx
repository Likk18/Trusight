import React from 'react';
import { useSessionStore } from '../../store/sessionStore';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export const TruthScoreChart: React.FC = () => {
  const history = useSessionStore((s) => s.truthScoreHistory);
  const fusion = useSessionStore((s) => s.fusion);
  const currentScore = fusion?.truth_likelihood_pct ?? 84;

  const data = history.length > 0
    ? history
    : Array.from({ length: 20 }, (_, i) => ({
        timestamp: `00:${String(i * 6).padStart(2, '0')}`,
        value: 80 + Math.sin(i * 0.4) * 6 + (Math.random() - 0.5) * 4,
      }));

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="section-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={12} style={{ color: 'var(--accent-cyan)' }} />
          <span>Truth Score Over Time</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono', color: '#00ff88' }}>
          {Math.round(currentScore)}%
        </span>
      </div>
      <div style={{ flex: 1, padding: '4px 8px 8px 0', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="truth-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ff88" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
            <XAxis dataKey="timestamp" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#0d1526', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: '#00ff88' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [`${typeof v === 'number' ? v.toFixed(1) : (v ?? '')}%`, 'Truth Score']}
            />
            <ReferenceLine y={70} stroke="rgba(245,158,11,0.3)" strokeDasharray="4 4" />
            <Area
              type="monotone" dataKey="value"
              stroke="#00ff88" strokeWidth={2}
              fill="url(#truth-grad)"
              dot={false} activeDot={{ r: 4, fill: '#00ff88' }}
              style={{ filter: 'drop-shadow(0 0 4px #00ff88)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
