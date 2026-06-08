export const VND = (n: number) => {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString("vi-VN") + "đ";
};

export const VNDshort = (n: number) => {
  const v = Math.round(Number(n) || 0);
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + "tr";
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(0) + "k";
  return String(v);
};

export const currentMonthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const daysLeftInMonth = (d = new Date()) => {
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return Math.max(0, end.getDate() - d.getDate());
};

export const daysInMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

export const dayOfMonth = (d = new Date()) => d.getDate();
