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
import { useSessionStore } from '../../store/sessionStore';

export const TopFusionChart: React.FC = () => {
  const truthScoreHistory = useSessionStore((s) => s.truthScoreHistory);

  // Progressive 10s linear plotting (starts empty, appends every 10s)
  const data = truthScoreHistory.map((p) => ({
    time: p.timestamp,
    value: Number((p.value / 100).toFixed(2)),
  }));

  return (
    <div
      style={{
        background: '#001422',
        border: '1px solid rgba(0, 212, 255, 0.25)',
        borderRadius: 8,
        padding: '6px 10px 0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Card Header ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 13,
            fontWeight: 800,
            color: '#F8FAFC',
            letterSpacing: '0.02em',
          }}
        >
          Fusion Score
        </span>
      </div>

      {/* ── Time-Series Linear Overlapping Area Chart (No Dots) ───────── */}
      <div style={{ flex: 1, minHeight: 0, width: '100%', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="topFusionGreenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ff88" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#00ff88" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.5)" vertical={true} />

            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={8.5}
              tickLine={false}
              axisLine={{ stroke: 'rgba(30, 41, 59, 0.8)' }}
            />

            <YAxis
              domain={[0, 1]}
              ticks={[0.0, 0.5, 1.0]}
              stroke="#64748b"
              fontSize={8.5}
              tickLine={false}
              axisLine={{ stroke: 'rgba(30, 41, 59, 0.8)' }}
              tickFormatter={(v) => v.toFixed(2)}
            />

            <Tooltip
              formatter={(value: any) => [`${Number(value).toFixed(2)}`, 'Fusion Score']}
              labelFormatter={(label) => `Time: ${label}`}
              contentStyle={{
                background: '#091522',
                border: '1px solid rgba(0, 212, 255, 0.4)',
                borderRadius: 6,
                fontSize: 10,
                color: '#fff',
              }}
            />

            {/* Dashed White Threshold Line at 0.5 */}
            <ReferenceLine
              y={0.5}
              stroke="#ffffff"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: 'Threshold (0.50)',
                position: 'insideBottomRight',
                fill: '#94a3b8',
                fontSize: 8.5,
                offset: 4,
              }}
            />

            <Area
              type="linear"
              dataKey="value"
              stroke="#00ff88"
              strokeWidth={2}
              fill="url(#topFusionGreenGrad)"
              isAnimationActive={false}
              dot={false}
              activeDot={{ r: 4, fill: '#00ff88', stroke: '#fff', strokeWidth: 1.5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
