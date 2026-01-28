import React from 'react';

interface StatusIndicatorProps {
  type: 'success' | 'failure' | 'error';
}

const statusLabel = (type: StatusIndicatorProps['type']) => {
  switch (type) {
    case 'success':
      return 'Success';
    case 'failure':
      return 'Failure';
    case 'error':
      return 'Error';
    default:
      return 'Status';
  }
};

export const StatusIndicator = React.memo(function StatusIndicator({ type }: StatusIndicatorProps) {
  const label = statusLabel(type);
  return (
    <span
      className={`gql-status-dot gql-status-${type}`}
      role="img"
      aria-label={label}
      title={label}
    />
  );
});
