import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSessionStore } from '../../store/sessionStore';

export const FusionScoreChart: React.FC = () => {
  const truthScoreHistory = useSessionStore((s) => s.truthScoreHistory);
  const fusion = useSessionStore((s) => s.fusion);

  const score = fusion?.truth_likelihood_pct ?? 74;

  const data = truthScoreHistory.length > 0
    ? truthScoreHistory.map((p) => ({
        time: p.timestamp,
        value: p.value / 100,
        truthScore: p.value / 100,
      }))
    : Array.from({ length: 12 }, (_, i) => ({
        time: `00:${String(i * 5).padStart(2, '0')}`,
        value: (score + Math.sin(i * 0.6) * 4) / 100,
        truthScore: (score + Math.sin(i * 0.6) * 4) / 100,
      }));

  return (
    <div
      style={{
        background: '#001422',
        border: '1px solid rgba(0, 212, 255, 0.2)',
        borderRadius: 8,
        padding: '8px 12px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, fontWeight: 800, color: '#F8FAFC' }}>
          Fusion Score Timeline
        </div>
        <div style={{ fontSize: 9, color: '#00d4ff', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
          {Math.round(score)}% CURRENT
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.5)" />
            <XAxis 
              dataKey="time" 
              stroke="#64748B"
              fontSize={9}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#64748B"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip 
              formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, 'Truth Likelihood']}
              labelFormatter={(label) => `Time: ${label}`}
              contentStyle={{
                background: '#0F172A',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: 6,
                fontSize: 10,
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#00D4FF"
              fill="url(#fusionGradient)"
              strokeWidth={2}
              fillOpacity={0.25}
            />
            <Area
              type="monotone"
              dataKey="truthScore"
              stroke="#00FF88"
              fill="url(#truthGradient)"
              strokeWidth={1.5}
              fillOpacity={0.12}
            />
            <defs>
              <linearGradient id="fusionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="truthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00FF88" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#00FF88" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: 8.5, color: '#64748B', textAlign: 'center', marginTop: 2 }}>
        10-second synchronized tumbling-window telemetry
      </div>
    </div>
  );
};
