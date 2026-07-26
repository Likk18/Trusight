import React from 'react';
import type { FactCheckStatus } from '../../types';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: FactCheckStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config = {
    SUPPORTED: {
      className: 'badge badge-supported',
      Icon: CheckCircle,
      label: 'Supported',
    },
    UNCERTAIN: {
      className: 'badge badge-uncertain',
      Icon: AlertCircle,
      label: 'Uncertain',
    },
    CONTRADICTED: {
      className: 'badge badge-contradicted',
      Icon: XCircle,
      label: 'Contradicted',
    },
  };
  const { className, Icon, label } = config[status];
  const iconSize = size === 'sm' ? 10 : 12;
  return (
    <span className={className}>
      <Icon size={iconSize} />
      {label}
    </span>
  );
};
