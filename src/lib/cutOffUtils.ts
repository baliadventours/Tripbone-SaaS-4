/**
 * Cut-off Time Utility Helpers for Tour Bookings
 * Enforces operational booking windows (e.g., closes 2h, 12h, 24h, 48h before departure).
 */

import { Tour } from '../types';

export const POPULAR_CUT_OFF_PRESETS = [
  { value: 0, label: 'No Cut-off (Instant same-minute booking)' },
  { value: 1, label: '1 Hour before departure' },
  { value: 2, label: '2 Hours before departure' },
  { value: 4, label: '4 Hours before departure' },
  { value: 6, label: '6 Hours before departure' },
  { value: 12, label: '12 Hours before departure' },
  { value: 24, label: '24 Hours (1 Day) before departure' },
  { value: 48, label: '48 Hours (2 Days) before departure' },
  { value: 72, label: '72 Hours (3 Days) before departure' },
] as const;

/**
 * Returns the effective cut-off hours for a given tour, falling back to tenant/site default or 0.
 */
export function getEffectiveCutOffHours(
  tour?: Partial<Tour> | null,
  defaultHours: number = 0
): number {
  if (tour && tour.cutOffHours !== undefined && tour.cutOffHours !== null && !isNaN(Number(tour.cutOffHours))) {
    return Math.max(0, Number(tour.cutOffHours));
  }
  return Math.max(0, Number(defaultHours) || 0);
}

/**
 * Parses date string (YYYY-MM-DD) and optional time slot (HH:mm) into a local Date object.
 */
export function getSlotDateTime(dateStr: string, timeSlot?: string | null): Date | null {
  if (!dateStr) return null;
  
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  let hours = 9; // Default 09:00 AM for daily tours without fixed time slots
  let minutes = 0;

  if (timeSlot && typeof timeSlot === 'string' && timeSlot.includes(':')) {
    const [h, m] = timeSlot.split(':');
    const parsedH = parseInt(h, 10);
    const parsedM = parseInt(m, 10);
    if (!isNaN(parsedH)) hours = parsedH;
    if (!isNaN(parsedM)) minutes = parsedM;
  }

  return new Date(year, month, day, hours, minutes, 0, 0);
}

/**
 * Checks if a specific date and time slot has passed the cut-off threshold.
 */
export function isSlotCutOff(
  dateStr: string,
  timeSlot?: string | null,
  cutOffHours: number = 0,
  referenceNow: number = Date.now()
): boolean {
  if (!dateStr) return false;
  if (cutOffHours <= 0) {
    // If 0 cut-off, check if slot is already in the past
    const slotDate = getSlotDateTime(dateStr, timeSlot);
    if (!slotDate) return false;
    return slotDate.getTime() <= referenceNow;
  }

  const slotDate = getSlotDateTime(dateStr, timeSlot);
  if (!slotDate) return false;

  const cutOffMs = cutOffHours * 60 * 60 * 1000;
  const deadlineTimestamp = slotDate.getTime() - cutOffMs;

  return referenceNow >= deadlineTimestamp;
}

/**
 * Checks if an entire calendar date is disabled due to all time slots passing cut-off.
 */
export function isDateFullyCutOff(
  dateStr: string,
  timeSlots?: string[] | null,
  cutOffHours: number = 0,
  referenceNow: number = Date.now()
): boolean {
  if (!dateStr) return false;

  // If tour has specific time slots, date is only fully cut off if ALL slots have passed cut-off
  if (timeSlots && timeSlots.length > 0) {
    return timeSlots.every(slot => isSlotCutOff(dateStr, slot, cutOffHours, referenceNow));
  }

  // Daily tour without slots
  return isSlotCutOff(dateStr, '09:00', cutOffHours, referenceNow);
}

/**
 * Formats a human-readable cut-off notice for cards, widgets, and badges.
 */
export function formatCutOffNotice(cutOffHours: number): string {
  if (cutOffHours <= 0) {
    return '⚡ Instant confirmation • Same-day booking available';
  }
  if (cutOffHours === 1) {
    return '⚡ Instant confirmation • Book up to 1 hour before departure';
  }
  if (cutOffHours === 2) {
    return '⚡ Book up to 2 hours before departure';
  }
  if (cutOffHours < 24) {
    return `⏳ Bookings close ${cutOffHours} hours before departure`;
  }
  if (cutOffHours === 24) {
    return '⏳ Bookings close 24 hours (1 day) before departure';
  }
  if (cutOffHours === 48) {
    return '⏳ Bookings close 48 hours (2 days) before departure';
  }
  if (cutOffHours % 24 === 0) {
    const days = cutOffHours / 24;
    return `⏳ Bookings close ${days} days before departure`;
  }
  return `⏳ Bookings close ${cutOffHours} hours before departure`;
}

/**
 * Evaluates full cut-off status for checkout / booking validation.
 */
export function validateBookingCutOff(
  tour: Partial<Tour> | null | undefined,
  dateStr: string,
  timeSlot?: string | null,
  defaultHours: number = 0
): { isValid: boolean; error?: string; cutOffHours: number } {
  const cutOffHours = getEffectiveCutOffHours(tour, defaultHours);
  
  if (!dateStr) {
    return { isValid: false, error: 'Please select a tour date.', cutOffHours };
  }

  if (isSlotCutOff(dateStr, timeSlot, cutOffHours)) {
    const slotLabel = timeSlot ? ` at ${timeSlot}` : '';
    if (cutOffHours <= 0) {
      return {
        isValid: false,
        error: `The departure on ${dateStr}${slotLabel} has already passed. Please choose a future date or time.`,
        cutOffHours
      };
    }
    return {
      isValid: false,
      error: `Online booking is closed for ${dateStr}${slotLabel}. This tour requires at least ${cutOffHours} hour${cutOffHours > 1 ? 's' : ''} advance notice before departure. Please select another date or contact our support team.`,
      cutOffHours
    };
  }

  return { isValid: true, cutOffHours };
}
