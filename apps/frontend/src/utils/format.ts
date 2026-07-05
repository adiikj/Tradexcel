// Shared money/percent formatting so every page renders numbers the same way
// (2 decimal places, ₹ with Indian digit grouping) instead of each component
// rolling its own toFixed/toLocaleString.

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
