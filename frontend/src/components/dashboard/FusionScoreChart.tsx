import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const generateTimePoints = () => {
  const points = [];
  for (let i = 0; i <= 60; i += 5) {
    const timeStr = i.toString().padStart(2, '0') + '.' + '00';
    points.push({ 
      time: timeStr, 
      value: Math.random() * 0.4 + 0.6,
      truthScore: Math.random() * 0.3 + 0.7
    });
  }
  return points;
};

export const FusionScoreChart: React.FC = () => {
  const [data] = React.useState(generateTimePoints());

  return (
    <div
      style={{
        background: '#001422',
        border: '1px solid rgba(0, 212, 255, 0.2)',
        borderRadius: 8,
        padding: '12px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 800, color: '#F8FAFC', marginBottom: 8 }}>
        Fusion Score Timeline
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.5)" />
            <XAxis 
              dataKey="time" 
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip 
              formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, 'Score']}
              labelFormatter={(label) => `Time: ${label}`}
              contentStyle={{
                background: '#0F172A',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: 6,
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#00D4FF"
              fill="url(#fusionGradient)"
              strokeWidth={2}
              fillOpacity={0.2}
            />
            <Area
              type="monotone"
              dataKey="truthScore"
              stroke="#06FCD7"
              fill="url(#truthGradient)"
              strokeWidth={1.5}
              fillOpacity={0.1}
            />
            <defs>
              <linearGradient id="fusionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="truthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06FCD7" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#06FCD7" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: 9, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
        10-second synchronized fusion evaluation
      </div>
    </div>
  );
};
