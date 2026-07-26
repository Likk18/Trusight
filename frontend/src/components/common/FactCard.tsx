import React from 'react';
import type { FactCheckResult } from '../../types';
import { StatusBadge } from './StatusBadge';
import { Database, Mail, Monitor, Calendar } from 'lucide-react';

interface FactCardProps {
  result: FactCheckResult;
}

const sourceIcon = (source: string) => {
  if (source.toLowerCase().includes('calendar')) return <Calendar size={12} />;
  if (source.toLowerCase().includes('email')) return <Mail size={12} />;
  if (source.toLowerCase().includes('log') || source.toLowerCase().includes('system')) return <Monitor size={12} />;
  return <Database size={12} />;
};

export const FactCard: React.FC<FactCardProps> = ({ result }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'rgba(26, 36, 54, 0.6)',
        border: '1px solid rgba(30, 41, 59, 0.6)',
        borderRadius: 8,
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <span style={{ color: '#475569' }}>{sourceIcon(result.source)}</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>{result.source}</div>
          <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>{result.claim}</div>
        </div>
      </div>
      <StatusBadge status={result.result} />
    </div>
  );
};
