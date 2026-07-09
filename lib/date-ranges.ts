import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  subYears,
} from 'date-fns';

export type DateRangeKey =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'last_6_months'
  | '1_year'
  | '3_years'
  | 'lifetime'
  | 'custom';

export const DATE_RANGE_LABELS: Record<DateRangeKey, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  this_month: 'This Month',
  last_month: 'Last Month',
  last_6_months: 'Last 6 Months',
  '1_year': '1 Year',
  '3_years': '3 Years',
  lifetime: 'Lifetime',
  custom: 'Custom Range',
};

export function resolveDateRange(
  key: DateRangeKey,
  custom?: { from: string; to: string }
): { from: Date | null; to: Date | null } {
  const now = new Date();
  switch (key) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'yesterday': {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case 'this_week':
      return { from: startOfWeek(now), to: endOfDay(now) };
    case 'this_month':
      return { from: startOfMonth(now), to: endOfDay(now) };
    case 'last_month': {
      const lm = subMonths(now, 1);
      return { from: startOfMonth(lm), to: endOfMonth(lm) };
    }
    case 'last_6_months':
      return { from: startOfMonth(subMonths(now, 6)), to: endOfDay(now) };
    case '1_year':
      return { from: startOfYear(now), to: endOfDay(now) };
    case '3_years':
      return { from: startOfDay(subYears(now, 3)), to: endOfDay(now) };
    case 'lifetime':
      return { from: null, to: null };
    case 'custom':
      if (custom?.from && custom?.to) {
        return { from: startOfDay(new Date(custom.from)), to: endOfDay(new Date(custom.to)) };
      }
      return { from: null, to: null };
    default:
      return { from: null, to: null };
  }
}
