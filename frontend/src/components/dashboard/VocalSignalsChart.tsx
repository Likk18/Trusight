import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSessionStore } from '../../store/sessionStore';

export const VocalSignalsChart: React.FC = () => {
  const voiceFeatureHistory = useSessionStore((s) => s.voiceFeatureHistory);
  const voice = useSessionStore((s) => s.voice);

  const data = voiceFeatureHistory.length > 0
    ? voiceFeatureHistory.map((p) => ({
        time: p.timestamp,
        pitchVariation: (p.pitchStability ?? 80) / 100,
        speechRate: ((voice?.metrics.speech_rate_wpm ?? 140) / 220),
        vocalFillers: ((p.hesitation ?? 20) / 100),
        voiceStability: (p.truth ?? 80) / 100,
      }))
    : Array.from({ length: 12 }, (_, i) => ({
        time: `00:${String(i * 5).padStart(2, '0')}`,
        pitchVariation: Math.min(1, Math.max(0.1, 0.65 + Math.sin(i * 0.5) * 0.15)),
        speechRate: Math.min(1, Math.max(0.1, 0.62 + Math.cos(i * 0.4) * 0.12)),
        vocalFillers: Math.min(1, Math.max(0.05, 0.22 + Math.sin(i * 0.7) * 0.1)),
        voiceStability: Math.min(1, Math.max(0.1, 0.82 + Math.cos(i * 0.3) * 0.1)),
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
          Vocal Signals
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8.5, color: '#64748B' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }} />
          <span>Pitch</span>
          <span style={{ marginLeft: 4, width: 5, height: 5, borderRadius: '50%', background: '#F59E0B' }} />
          <span>Cadence</span>
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
                  pitchVariation: 'Pitch Stability',
                  speechRate: 'Speech Cadence',
                  vocalFillers: 'Hesitation/Fillers',
                  voiceStability: 'Vocal Truth Score'
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
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="speechGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="stabilityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: 8.5, color: '#64748B', textAlign: 'center', marginTop: 2 }}>
        Parselmouth & Librosa acoustic feature dynamics
      </div>
    </div>
  );
};
