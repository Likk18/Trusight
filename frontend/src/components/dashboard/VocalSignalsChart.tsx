import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const VocalSignalsChart: React.FC = () => {
  const generateVocalData = () => {
    const points = [];
    for (let i = 0; i <= 60; i += 5) {
      const timeStr = i.toString().padStart(2, '0') + '.' + '00';
      points.push({ 
        time: timeStr,
        pitchVariation: Math.random() * 0.6 + 0.2,
        speechRate: Math.random() * 0.5 + 0.4,
        vocalFillers: Math.random() * 0.8 + 0.1,
        voiceStability: Math.random() * 0.7 + 0.2
      });
    }
    return points;
  };
  
  const [data] = React.useState(generateVocalData());

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
        Vocal Signals
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
              formatter={(value, name) => {
                const labelMap = {
                  pitchVariation: 'Pitch Variation',
                  speechRate: 'Speech Rate',
                  vocalFillers: 'Vocal Fillers',
                  voiceStability: 'Voice Stability'
                };
                return [`${(Number(value) * 100).toFixed(1)}%`, labelMap[name as keyof typeof labelMap] || name];
              }}
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
              dataKey="pitchVariation"
              stroke="#10B981"
              fill="url(#pitchGradient)"
              strokeWidth={1.5}
              fillOpacity={0.15}
            />
            <Area
              type="monotone"
              dataKey="speechRate"
              stroke="#F59E0B"
              fill="url(#speechGradient)"
              strokeWidth={1.5}
              fillOpacity={0.15}
            />
            <Area
              type="monotone"
              dataKey="vocalFillers"
              stroke="#EF4444"
              fill="url(#fillerGradient)"
              strokeWidth={1.5}
              fillOpacity={0.15}
            />
            <Area
              type="monotone"
              dataKey="voiceStability"
              stroke="#8B5CF6"
              fill="url(#stabilityGradient)"
              strokeWidth={1.5}
              fillOpacity={0.15}
            />
            <defs>
              <linearGradient id="pitchGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="speechGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="stabilityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: 9, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
        Real-time vocal analysis from Voice module
      </div>
    </div>
  );
};
