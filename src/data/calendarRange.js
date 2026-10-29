/** UTC-only calendar helpers: YYYY-MM-DD values never shift with the browser timezone. */
export const isoDay = date => date.toISOString().slice(0, 10);
export const utcDate = value => new Date(`${value}T00:00:00.000Z`);

export function monthGrid(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const start = new Date(first);
  start.setUTCDate(1 - first.getUTCDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    return { iso: isoDay(day), label: day.getUTCDate(), inMonth: day.getUTCMonth() === month - 1 };
  });
}
export function moveMonth(monthKey, offset) {
  const [year, month] = monthKey.split('-').map(Number);
  return isoDay(new Date(Date.UTC(year, month - 1 + offset, 1))).slice(0, 7);
}
export function selectRangeDay(start, end, day, awaitingEnd = false) {
  if (!awaitingEnd || !start || end) return { start: day, end: '', awaitingEnd: true };
  return day < start
    ? { start: day, end: '', awaitingEnd: true }
    : { start, end: day, awaitingEnd: false };
}
const validDay = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = utcDate(value);
  return !Number.isNaN(date.getTime()) && isoDay(date) === value;
};
export const rangeIsComplete = (start, end, maxDay) =>
  validDay(start) && validDay(end) && validDay(maxDay) && start <= end && end <= maxDay;

/**
 * Choose an on-screen position for the calendar, relative to its date button.
 * All values are visual-viewport CSS pixels. Keeps the popup within the visible
 * viewport, flips vertically when necessary, and constrains its scroll height.
 * Pure so it can be tested with desktop/mobile/scrolled viewport measurements.
 */
export function calendarPopoverPosition(anchor, popup, viewport, gutter = 12, gap = 8) {
  const viewportLeft = viewport.left || 0;
  const viewportTop = viewport.top || 0;
  const right = viewportLeft + viewport.width;
  const bottom = viewportTop + viewport.height;
  const width = Math.max(0, Math.min(popup.width, viewport.width - gutter * 2));
  const left = Math.max(viewportLeft + gutter, Math.min(anchor.right - width, right - gutter - width));
  const aboveSpace = Math.max(0, anchor.top - viewportTop - gutter - gap);
  const belowSpace = Math.max(0, bottom - anchor.bottom - gutter - gap);
  const above = belowSpace < popup.height && aboveSpace > belowSpace;
  const available = above ? aboveSpace : belowSpace;
  const maxHeight = Math.max(0, Math.min(popup.height, available));
  const top = above ? anchor.top - gap - maxHeight : anchor.bottom + gap;
  return { left, top, width, maxHeight, placement: above ? 'top' : 'bottom' };
}
