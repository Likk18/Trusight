import React from 'react';
import { useSessionStore } from '../../store/sessionStore';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Activity } from 'lucide-react';

const MODEL_COLORS = {
  face: '#8b5cf6',
  voice: '#00d4ff',
  text: '#00ff88',
  evidence: '#f59e0b',
};

export const ModelScoreChart: React.FC = () => {
  const history = useSessionStore((s) => s.modelScoreHistory);

  const data = history.length > 0
    ? history
    : Array.from({ length: 20 }, (_, i) => ({
        timestamp: `00:${String(i * 6).padStart(2, '0')}`,
        face: 86 + Math.sin(i * 0.3) * 5,
        voice: 78 + Math.sin(i * 0.5 + 1) * 7,
        text: 89 + Math.sin(i * 0.4 + 2) * 4,
        evidence: 83 + Math.sin(i * 0.35 + 0.5) * 5,
      }));

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="section-header">
        <Activity size={12} style={{ color: 'var(--accent-cyan)' }} />
        <span>Per Model Score Over Time</span>
      </div>
      <div style={{ flex: 1, padding: '4px 8px 8px 0', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
            <XAxis dataKey="timestamp" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#0d1526', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#94a3b8' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any, name: any) => [`${typeof v === 'number' ? v.toFixed(1) : (v ?? '')}%`, typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : name]}
            />
            <Legend
              iconType="line" iconSize={12}
              wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
              formatter={(value) => <span style={{ color: '#64748b' }}>{value.charAt(0).toUpperCase() + value.slice(1)}</span>}
            />
            {Object.entries(MODEL_COLORS).map(([key, color]) => (
              <Line
                key={key} type="monotone" dataKey={key}
                stroke={color} strokeWidth={1.5}
                dot={false} activeDot={{ r: 3, fill: color }}
                style={{ filter: `drop-shadow(0 0 3px ${color})` }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
