import React from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { Grid3x3 } from 'lucide-react';

function scoreToColor(score: number): string {
  if (score >= 75) return '#00ff88';
  if (score >= 55) return '#22c55e';
  if (score >= 45) return '#f59e0b';
  if (score >= 30) return '#f97316';
  return '#ef4444';
}

export const TimelineHeatmap: React.FC = () => {
  const history = useSessionStore((s) => s.heatmapHistory);

  const cells = history.length > 0
    ? history
    : Array.from({ length: 36 }, (_, i) => {
        const score = 75 + Math.sin(i * 0.3) * 20 + (Math.random() - 0.5) * 10;
        return {
          timestamp: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
          score: Math.min(100, Math.max(0, score)),
          label: score >= 70 ? 'High Truth' : score >= 45 ? 'Moderate' : 'Low Truth',
        };
      });

  const startLabel = cells[0]?.timestamp ?? '00:00';
  const midLabel = cells[Math.floor(cells.length / 2)]?.timestamp ?? '01:30';
  const endLabel = cells[cells.length - 1]?.timestamp ?? '03:00';

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="section-header">
        <Grid3x3 size={12} style={{ color: 'var(--accent-cyan)' }} />
        <span>Timeline Heatmap</span>
      </div>
      <div style={{ padding: '8px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Heatmap cells */}
        <div style={{ display: 'flex', gap: 2, flex: 1, alignItems: 'center' }}>
          {cells.map((cell, i) => (
            <div
              key={i}
              className="heatmap-cell"
              title={`${cell.timestamp}: ${cell.score.toFixed(0)}% — ${cell.label}`}
              style={{
                background: scoreToColor(cell.score),
                opacity: 0.7 + (cell.score / 100) * 0.3,
                boxShadow: cell.score >= 70 ? `0 0 4px ${scoreToColor(cell.score)}60` : 'none',
              }}
            />
          ))}
        </div>

        {/* Time labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: '#475569', fontFamily: 'JetBrains Mono' }}>
          <span>{startLabel}</span>
          <span>{midLabel}</span>
          <span>{endLabel}</span>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 9.5, alignItems: 'center' }}>
          {[
            { label: 'High Truth', color: '#00ff88' },
            { label: 'Moderate', color: '#f59e0b' },
            { label: 'Low Truth', color: '#ef4444' },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
              <span style={{ color: '#64748b' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
