import React, { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { calendarPopoverPosition, monthGrid, moveMonth, rangeIsComplete, selectRangeDay, utcDate } from '../../data/calendarRange.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const displayDate = value => value ? utcDate(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'Select date';
const fullDate = value => utcDate(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const monthTitle = key => utcDate(`${key}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/**
 * Date picker for chart filters. It does not preselect a range when opened.
 * The popup is portalled to the document body to avoid clipping by a card or
 * scroll container; fixed coordinates are remeasured on scroll/resize.
 */
export default function ChartDateRangePicker({ start, end, maxDate, onApply, open, onOpenChange }) {
  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const dialogId = useId();
  const [draftStart, setDraftStart] = useState('');
  const [draftEnd, setDraftEnd] = useState('');
  const [awaitingEnd, setAwaitingEnd] = useState(false);
  const [month, setMonth] = useState(maxDate.slice(0, 7));
  const [position, setPosition] = useState(null);

  // Each opening is a fresh range selection—even if a previous selection was applied.
  useLayoutEffect(() => {
    if (!open) return;
    setDraftStart('');
    setDraftEnd('');
    setAwaitingEnd(false);
    setMonth(maxDate.slice(0, 7));
    setPosition(null);
  }, [open, maxDate]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const popup = popupRef.current;
    if (!trigger || !popup) return;
    const rect = trigger.getBoundingClientRect();
    const visual = window.visualViewport;
    const viewport = {
      left: visual?.offsetLeft || 0,
      top: visual?.offsetTop || 0,
      width: visual?.width || window.innerWidth,
      height: visual?.height || window.innerHeight,
    };
    // An anchor scrolled entirely out of view should not leave an orphan popup.
    if (rect.bottom <= viewport.top || rect.top >= viewport.top + viewport.height ||
        rect.right <= viewport.left || rect.left >= viewport.left + viewport.width) {
      onOpenChange(false);
      return;
    }
    const next = calendarPopoverPosition(
      rect,
      { width: 354, height: popup.scrollHeight || popup.getBoundingClientRect().height },
      viewport,
    );
    setPosition(previous => previous && Object.keys(next).every(key => previous[key] === next[key]) ? previous : next);
  }, [onOpenChange]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    let frame = 0;
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { frame = 0; updatePosition(); });
    };
    // Run before paint so the popup does not flash at (0, 0).
    updatePosition();
    // Capture scroll on the page AND any nested scrolling container.
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule, { passive: true });
    window.visualViewport?.addEventListener('resize', schedule);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    if (triggerRef.current) observer?.observe(triggerRef.current);
    if (popupRef.current) observer?.observe(popupRef.current);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      observer?.disconnect();
    };
  }, [open, updatePosition]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const onPointerDown = event => {
      if (!triggerRef.current?.contains(event.target) && !popupRef.current?.contains(event.target)) {
        onOpenChange(false);
      }
    };
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange]);

  const chooseDay = day => {
    if (day > maxDate) return;
    const selection = selectRangeDay(draftStart, draftEnd, day, awaitingEnd);
    setDraftStart(selection.start);
    setDraftEnd(selection.end);
    setAwaitingEnd(selection.awaitingEnd);
    if (day.slice(0, 7) !== month) setMonth(day.slice(0, 7));
  };
  const apply = () => {
    if (!rangeIsComplete(draftStart, draftEnd, maxDate)) return;
    onApply(draftStart, draftEnd);
    onOpenChange(false);
    triggerRef.current?.focus();
  };
  const close = () => { onOpenChange(false); triggerRef.current?.focus(); };
  const displayDays = monthGrid(month);
  const nextMonth = moveMonth(month, 1);

  const popup = open && <div
    className="ssc-calendar-popover" id={dialogId} role="dialog" aria-label="Choose inspection date range"
    data-placement={position?.placement || 'bottom'} ref={popupRef}
    style={position ? { top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight, visibility: 'visible' } : { top: 0, left: 0, visibility: 'hidden' }}>
    <div className="ssc-calendar-popover-top">
      <div><span className="ssc-calendar-kicker">CUSTOM DATE RANGE</span><strong>{monthTitle(month)}</strong></div>
      <button type="button" className="ssc-calendar-dismiss" aria-label="Close calendar" onClick={close}><X size={16}/></button>
    </div>
    <div className="ssc-calendar-draft" aria-live="polite">
      <span className={awaitingEnd ? 'active' : ''}><small>FROM</small>{displayDate(draftStart)}</span>
      <span className={draftEnd ? 'active' : ''}><small>TO</small>{displayDate(draftEnd)}</span>
    </div>
    <div className="ssc-calendar-month-head">
      <button type="button" onClick={() => setMonth(moveMonth(month, -1))} aria-label="Previous month"><ChevronLeft size={19}/></button>
      <span aria-live="polite">{monthTitle(month)}</span>
      <button type="button" onClick={() => setMonth(nextMonth)} disabled={nextMonth > maxDate.slice(0, 7)} aria-label="Next month"><ChevronRight size={19}/></button>
    </div>
    <div className="ssc-calendar-weekdays" aria-hidden="true">{WEEKDAYS.map(day => <span key={day}>{day}</span>)}</div>
    <div className="ssc-calendar-days" role="group" aria-label={`${monthTitle(month)} dates`}>
      {displayDays.map(day => {
        const selectedStart = draftStart === day.iso;
        const selectedEnd = draftEnd === day.iso;
        const inRange = draftStart && draftEnd && day.iso > draftStart && day.iso < draftEnd;
        const disabled = day.iso > maxDate;
        const today = day.iso === maxDate;
        return <button key={day.iso} type="button" disabled={disabled}
          aria-label={fullDate(day.iso)} aria-pressed={selectedStart || selectedEnd}
          className={[!day.inMonth && 'is-outside', inRange && 'is-in-range', (selectedStart || selectedEnd) && 'is-endpoint', today && 'is-today'].filter(Boolean).join(' ')}
          onClick={() => chooseDay(day.iso)}>{day.label}</button>;
      })}
    </div>
    <div className="ssc-calendar-bottom"><span>{awaitingEnd ? 'Select an end date' : draftEnd ? 'Dates are inclusive' : 'Select a start date'}</span><div><button type="button" className="ssc-calendar-cancel" onClick={close}>Cancel</button><button type="button" className="ssc-calendar-apply" onClick={apply} disabled={!rangeIsComplete(draftStart, draftEnd, maxDate)}>Apply</button></div></div>
  </div>;

  return <div className="ssc-calendar-picker">
    <button type="button" className={`ssc-calendar-trigger${open ? ' is-open' : ''}`} ref={triggerRef} aria-expanded={open} aria-controls={open ? dialogId : undefined} aria-haspopup="dialog" onClick={() => onOpenChange(!open)}>
      <CalendarDays size={16} aria-hidden="true" />
      <span>{start && end ? <>{displayDate(start)} <span className="ssc-calendar-trigger-divider">to</span> {displayDate(end)}</> : 'Select date range'}</span>
      <ChevronDown size={15} aria-hidden="true" />
    </button>
    {open && typeof document !== 'undefined' && createPortal(popup, document.body)}
  </div>;
}
