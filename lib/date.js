export function formatLocalDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function getTodayDate() {
  return formatLocalDate(new Date());
}

export function getDaysAgoDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatLocalDate(d);
}

export function getMonthKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}