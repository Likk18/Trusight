import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSessionStore } from '../../store/sessionStore';

export const FacialSignalsChart: React.FC = () => {
  const face = useSessionStore((s) => s.face);
  
  // Generate facial signal data over time
  const generateFacialData = () => {
    const points = [];
    for (let i = 0; i <= 60; i += 5) {
      const timeStr = i.toString().padStart(2, '0') + '.' + '00';
      const microVal = face?.metrics.micro_expressions_level === 'High' ? 0.8 : face?.metrics.micro_expressions_level === 'Medium' ? 0.5 : 0.2;
      const gazeVal = face ? (100 - face.metrics.eye_contact_pct) / 100 : 0.2;
      points.push({ 
        time: timeStr,
        microExpressions: microVal,
        gazeDeviation: gazeVal,
        headMovement: Math.random() * 0.4 + 0.2,
        eyeBlinkRate: Math.random() * 0.3 + 0.3
      });
    }
    return points;
  };
  
  const [data] = React.useState(generateFacialData());

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 800, color: '#F8FAFC' }}>
          Facial Signals
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#64748B' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6' }} />
          <span>Micro-expressions</span>
          <span style={{ marginLeft: 6, width: 6, height: 6, borderRadius: '50%', background: '#F97316' }} />
          <span>Gaze</span>
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
              formatter={(value, name) => {
                const labelMap = {
                  microExpressions: 'Micro-expressions',
                  gazeDeviation: 'Gaze Deviation',
                  headMovement: 'Head Movement',
                  eyeBlinkRate: 'Eye Blink Rate'
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
              dataKey="microExpressions"
              stroke="#8B5CF6"
              fill="url(#microExprGradient)"
              strokeWidth={1.5}
              fillOpacity={0.15}
            />
            <Area
              type="monotone"
              dataKey="gazeDeviation"
              stroke="#F97316"
              fill="url(#gazeGradient)"
              strokeWidth={1.5}
              fillOpacity={0.15}
            />
            <Area
              type="monotone"
              dataKey="headMovement"
              stroke="#06FCD7"
              fill="url(#headGradient)"
              strokeWidth={1.5}
              fillOpacity={0.15}
            />
            <Area
              type="monotone"
              dataKey="eyeBlinkRate"
              stroke="#EC4899"
              fill="url(#blinkGradient)"
              strokeWidth={1.5}
              fillOpacity={0.15}
            />
            <defs>
              <linearGradient id="microExprGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gazeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F97316" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="headGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06FCD7" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#06FCD7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="blinkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EC4899" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#EC4899" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: 9, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
        Live facial analysis from Face module
      </div>
    </div>
  );
};
