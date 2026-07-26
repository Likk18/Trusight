import React from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { ScoreRing } from '../common/ScoreRing';
import { FactCard } from '../common/FactCard';
import { FileText, CheckCircle } from 'lucide-react';
import type { HighlightedStatement } from '../../types';

const HighlightedTranscript: React.FC<{
  transcript: string;
  statements: HighlightedStatement[];
}> = ({ transcript, statements }) => {
  if (!statements.length) {
    return <span style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: 13 }}>{transcript}</span>;
  }

  // Build segments: split transcript by highlighted texts
  const segments: Array<{ text: string; highlighted?: HighlightedStatement }> = [];
  let remaining = transcript;

  for (const stmt of statements) {
    const idx = remaining.indexOf(stmt.text);
    if (idx === -1) continue;
    if (idx > 0) segments.push({ text: remaining.slice(0, idx) });
    segments.push({ text: stmt.text, highlighted: stmt });
    remaining = remaining.slice(idx + stmt.text.length);
  }
  if (remaining) segments.push({ text: remaining });

  return (
    <p style={{ lineHeight: 1.9, fontSize: 13, color: '#cbd5e1' }}>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <span
            key={i}
            className={`highlight-${seg.highlighted.status.toLowerCase()}`}
            title={`${seg.highlighted.status}: ${seg.highlighted.evidence}`}
          >
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </p>
  );
};

export const TranscriptPanel: React.FC = () => {
  const text = useSessionStore((s) => s.text);
  const sessionState = useSessionStore((s) => s.sessionState);

  const textScore = text?.text_score ?? 91;
  const transcript = text?.transcript ?? 'I arrived at the office around 10:15 AM. I had a meeting with the team and we discussed the new project requirements. After that, I worked on the proposal and submitted it by 2 PM.';
  const highlighted = text?.highlighted_statements ?? [
    { text: '10:15 AM', status: 'SUPPORTED' as const, evidence: 'Calendar Event / Login Log' },
    { text: 'meeting', status: 'UNCERTAIN' as const, evidence: 'No direct calendar invite found' },
    { text: 'new project requirements', status: 'SUPPORTED' as const, evidence: 'Project Document matches statement' },
    { text: 'submitted it by 2 PM', status: 'SUPPORTED' as const, evidence: 'Email Record sent at 1:58 PM' },
  ];
  const factChecks = text?.fact_check_results ?? [
    { source: 'Calendar Event', claim: '10:00 AM - 11:00 AM', result: 'SUPPORTED' as const },
    { source: 'Project Document', claim: 'Matches statement', result: 'SUPPORTED' as const },
    { source: 'Email Record', claim: 'Sent at 1:58 PM', result: 'SUPPORTED' as const },
    { source: 'System Log', claim: 'Login at 10:12 AM', result: 'SUPPORTED' as const },
  ];
  const keyReasons = text?.key_reasons ?? [
    'High linguistic consistency across statements',
    'Low uncertainty phrasing / hedging words',
    'Clear, direct syntactic structures',
  ];

  const scoreColor = textScore >= 85 ? '#00ff88' : textScore >= 65 ? '#f59e0b' : '#ef4444';
  const scoreLabel = textScore >= 85 ? 'Excellent' : textScore >= 65 ? 'Good' : 'Poor';

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div className="section-header">
        <FileText size={12} style={{ color: 'var(--accent-cyan)' }} />
        <span>Transcript & Text Analysis</span>
        {sessionState === 'Live_Recording' && <span className="live-dot" />}
        {sessionState === 'Live_Recording' && (
          <span style={{ fontSize: 9, color: 'var(--accent-green)', marginLeft: 2 }}>LIVE</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, padding: '10px 12px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Left: Transcript */}
        <div style={{ flex: '0 0 55%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, fontSize: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(0,255,136,0.4)', display: 'inline-block' }} />
              <span style={{ color: '#475569' }}>Supported</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(245,158,11,0.4)', display: 'inline-block' }} />
              <span style={{ color: '#475569' }}>Uncertain</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(239,68,68,0.4)', display: 'inline-block' }} />
              <span style={{ color: '#475569' }}>Contradicted</span>
            </span>
          </div>

          {/* Transcript */}
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(10, 15, 30, 0.6)',
              border: '1px solid rgba(30,41,59,0.5)',
              borderRadius: 8,
              flex: 1,
            }}
          >
            <HighlightedTranscript transcript={transcript} statements={highlighted} />
          </div>
        </div>

        {/* Right: Text Score + Fact Check */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          {/* Text Score */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <ScoreRing score={textScore} size={64} strokeWidth={4} color={scoreColor} label={scoreLabel} fontSize={13} />
              <span style={{ fontSize: 10, color: '#64748b' }}>Text Score</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>
                Key Reasons
              </div>
              {keyReasons.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 4, fontSize: 10.5, color: '#94a3b8', alignItems: 'flex-start' }}>
                  <CheckCircle size={9} color="#00ff88" style={{ marginTop: 2, flexShrink: 0 }} />
                  {r}
                </div>
              ))}
            </div>
          </div>

          {/* Fact Check */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Fact Check Results
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {factChecks.map((fc, i) => (
                <FactCard key={i} result={fc} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
