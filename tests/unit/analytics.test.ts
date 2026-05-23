import { calculateTrend, rangeToDates } from '@/lib/analytics/metrics';

describe('calculateTrend', () => {
  it('detects an upward trend across the series', () => {
    const result = calculateTrend([10, 12, 14, 18, 22, 26]);
    expect(result.direction).toBe('up');
    expect(result.changePct).toBeGreaterThan(0);
  });

  it('detects a downward trend across the series', () => {
    const result = calculateTrend([100, 90, 85, 70, 60, 50]);
    expect(result.direction).toBe('down');
    expect(result.changePct).toBeLessThan(0);
  });

  it('flags flat series', () => {
    const result = calculateTrend([5, 5, 5, 5]);
    expect(result.direction).toBe('flat');
  });

  it('returns flat for empty input', () => {
    const result = calculateTrend([]);
    expect(result.direction).toBe('flat');
    expect(result.changePct).toBe(0);
  });
});

describe('rangeToDates', () => {
  it('returns a from/to pair with from before to', () => {
    const { from, to } = rangeToDates('30d');
    expect(new Date(from).getTime()).toBeLessThan(new Date(to).getTime());
  });

  it('supports the 7d / 30d / 90d shortcuts', () => {
    const r7 = rangeToDates('7d');
    const r30 = rangeToDates('30d');
    const span7 = new Date(r7.to).getTime() - new Date(r7.from).getTime();
    const span30 = new Date(r30.to).getTime() - new Date(r30.from).getTime();
    expect(span30).toBeGreaterThan(span7);
  });
});
