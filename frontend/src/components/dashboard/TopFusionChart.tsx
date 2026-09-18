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

  // Generate realistic time-series points if history is short
  const data = truthScoreHistory.length >= 10
    ? truthScoreHistory.map((p, i) => ({
        time: p.timestamp,
        value: p.value / 100,
        isEvent: i === Math.floor(truthScoreHistory.length * 0.75),
      }))
    : [
        { time: '00:00', value: 0.68 },
        { time: '01:30', value: 0.72 },
        { time: '03:00', value: 0.76 },
        { time: '04:30', value: 0.65 },
        { time: '06:00', value: 0.58 },
        { time: '07:30', value: 0.70 },
        { time: '09:00', value: 0.78 },
        { time: '10:50', value: 0.84, isEvent: true },
        { time: '12:00', value: 0.74 },
        { time: '13:30', value: 0.79 },
        { time: '15:00', value: 0.74 },
      ];

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#00d4ff', fontSize: 12, fontWeight: 900 }}>▰</span>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              fontFamily: 'Space Grotesk, JetBrains Mono',
              fontSize: 11,
              fontWeight: 700,
              color: '#00ff88',
              background: 'rgba(0, 255, 136, 0.12)',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              padding: '1px 6px',
              borderRadius: 4,
            }}
          >
            ↑ 10%
          </span>
        </div>
      </div>

      {/* ── Time-Series Chart (Full Edge-to-Edge Coverage) ───────────── */}
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
              tickFormatter={(v) => v.toFixed(1)}
            />

            <Tooltip
              formatter={(value: any) => [`${(Number(value) * 100).toFixed(0)}%`, 'Fusion Truth']}
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
                value: 'Threshold (0.5)',
                position: 'insideBottomRight',
                fill: '#94a3b8',
                fontSize: 8.5,
                offset: 4,
              }}
            />

            {/* Event Marker at 10:50 */}
            <ReferenceLine
              x="10:50"
              stroke="#00ff88"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              label={{
                value: 'Event: Claim Peak',
                position: 'top',
                fill: '#00ff88',
                fontSize: 8,
              }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#00ff88"
              strokeWidth={2}
              fill="url(#topFusionGreenGrad)"
              dot={(props: any) => {
                if (props.payload.isEvent || props.payload.time === '10:50') {
                  return (
                    <circle
                      key={props.index}
                      cx={props.cx}
                      cy={props.cy}
                      r={4.5}
                      fill="#00ff88"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      style={{ filter: 'drop-shadow(0 0 6px #00ff88)' }}
                    />
                  );
                }
                return <React.Fragment key={props.index} />;
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
