export const formatInr = (value: number | string | null | undefined) => {
  const n = Number(value ?? 0);
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatSignedInr = (value: number | string | null | undefined) => {
  const n = Number(value ?? 0);
  return `${n >= 0 ? '+' : ''}${formatInr(n)}`;
};

export const formatPercent = (value: number | string | null | undefined) => {
  const n = Number(value ?? 0);
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
};

// Accepts either an ISO date string or an epoch-ms timestamp.
export const timeAgo = (value: string | number) => {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
