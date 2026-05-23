import { formatCurrency, formatDate, formatNumber, initials, relativeTime } from '@/lib/utils';

describe('formatCurrency', () => {
  it('formats positive integers as GBP by default', () => {
    expect(formatCurrency(999)).toMatch(/£999/);
    expect(formatCurrency(2999)).toMatch(/£2,999/);
  });

  it('handles null / undefined / NaN as £0', () => {
    expect(formatCurrency(null)).toBe('£0');
    expect(formatCurrency(undefined)).toBe('£0');
    expect(formatCurrency(NaN)).toBe('£0');
  });
});

describe('formatNumber', () => {
  it('groups thousands with commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('handles null', () => {
    expect(formatNumber(null)).toBe('0');
  });
});

describe('formatDate', () => {
  it('renders ISO into a localised day-month-year string', () => {
    const out = formatDate('2026-01-15T00:00:00.000Z');
    expect(out).toMatch(/15/);
    expect(out).toMatch(/2026/);
  });

  it('returns "-" for null', () => {
    expect(formatDate(null)).toBe('-');
  });
});

describe('initials', () => {
  it('returns two-letter uppercase initials for two-word names', () => {
    expect(initials('Khamare Clarke')).toBe('KC');
  });

  it('returns first two letters for one-word names', () => {
    expect(initials('Sam')).toBe('SA');
  });

  it('falls back to "?" when blank', () => {
    expect(initials('')).toBe('?');
    expect(initials(null)).toBe('?');
  });
});

describe('relativeTime', () => {
  it('returns "just now" for very recent timestamps', () => {
    expect(relativeTime(new Date().toISOString())).toMatch(/just now|ago/i);
  });

  it('returns empty string for null', () => {
    expect(relativeTime(null)).toBe('');
  });

  it('returns "5m ago" for 5 minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(relativeTime(fiveMinAgo)).toBe('5m ago');
  });
});
