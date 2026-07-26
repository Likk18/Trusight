import React from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2 } from 'lucide-react';

const PIPELINE_STEPS = [
  { label: 'Video Ingestion', key: 'video' },
  { label: 'Audio Extraction', key: 'audio' },
  { label: 'Face Analysis', key: 'face' },
  { label: 'Speech Analysis', key: 'speech' },
  { label: 'Text Analysis', key: 'text' },
  { label: 'Evidence Retrieval', key: 'evidence' },
  { label: 'Fusion Engine', key: 'fusion' },
  { label: 'Result Generated', key: 'result' },
];

export const SystemStatus: React.FC = () => {
  const fusion = useSessionStore((s) => s.fusion);
  const sessionState = useSessionStore((s) => s.sessionState);

  const evidenceScore = fusion?.model_agreement.evidence_score ?? 85;
  const latency = fusion?.system_status.processing_latency_ms ?? 120;

  const donutData = [
    { name: 'Strong Evidence', value: 70, color: '#00ff88' },
    { name: 'Moderate Evidence', value: 20, color: '#f59e0b' },
    { name: 'Weak Evidence', value: 10, color: '#ef4444' },
  ];

  const isActive = sessionState === 'Live_Recording';

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', height: '100%', gap: 0 }}>
        {/* Evidence Donut */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 0 12px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            Evidence Strength
          </div>
          <div style={{ flex: 1, position: 'relative', minHeight: 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%" cy="50%"
                  innerRadius="55%" outerRadius="80%"
                  dataKey="value"
                  startAngle={90} endAngle={-270}
                  strokeWidth={0}
                >
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0d1526', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 11 }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [`${v}%`, 'Evidence']}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono', color: '#00ff88' }}>
                {Math.round(evidenceScore)}%
              </div>
              <div style={{ fontSize: 9, color: '#64748b' }}>Strong</div>
            </div>
          </div>
          {/* Donut Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {donutData.map(({ name, color }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9.5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0, display: 'inline-block' }} />
                <span style={{ color: '#64748b' }}>{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: 'rgba(30,41,59,0.6)', margin: '12px 0' }} />

        {/* System Status + Pipeline */}
        <div style={{ flex: 1, padding: '12px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              System Status
            </div>
            {[
              { label: 'Video Quality', value: 'Good' },
              { label: 'Audio Quality', value: 'Good' },
              { label: 'Lighting', value: 'Good' },
              { label: 'Background Noise', value: 'Low' },
              { label: 'Processing Latency', value: `${latency} ms` },
            ].map(({ label, value }) => (
              <div key={label} className="metric-row">
                <span className="metric-label" style={{ fontSize: 10 }}>{label}</span>
                <span className="metric-value green" style={{ fontSize: 10 }}>{value}</span>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              Processing Pipeline
            </div>
            {PIPELINE_STEPS.map(({ label, key }) => {
              const isResultStep = key === 'result';
              const isReady = isActive || isResultStep;
              return (
                <div key={key} className={`pipeline-step ${isReady ? 'active' : ''}`}>
                  <CheckCircle2 size={10} color={isReady ? '#00ff88' : '#1e293b'} />
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
