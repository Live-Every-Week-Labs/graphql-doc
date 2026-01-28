import React from 'react';

interface ResponseBadgeProps {
  type: 'success' | 'failure' | 'error';
  httpStatus?: number;
}

const statusText = (type: ResponseBadgeProps['type']) => {
  switch (type) {
    case 'success':
      return 'SUCCESS';
    case 'failure':
      return 'FAILURE';
    case 'error':
      return 'ERROR';
    default:
      return 'STATUS';
  }
};

const statusClass = (type: ResponseBadgeProps['type']) => {
  switch (type) {
    case 'success':
      return 'gql-badge-success';
    case 'failure':
      return 'gql-badge-warning';
    case 'error':
      return 'gql-badge-error';
    default:
      return 'gql-badge-neutral';
  }
};

export const ResponseBadge = React.memo(function ResponseBadge({
  type,
  httpStatus,
}: ResponseBadgeProps) {
  const text = statusText(type);
  const label = httpStatus ? `${text} ${httpStatus}` : text;

  return (
    <span className={`gql-badge ${statusClass(type)} gql-response-badge`} title={label}>
      {label}
    </span>
  );
});
