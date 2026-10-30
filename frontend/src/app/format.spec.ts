import { money, pct } from './format';

describe('format', () => {
  it('formats whole currency amounts', () => {
    expect(money(1234567, 'USD')).toBe('$1,234,567');
  });
  it('formats compact amounts', () => {
    expect(money(1500000, 'USD', true)).toBe('$1.5M');
  });
  it('computes bar position as a clamped percentage', () => {
    expect(pct(50, 200)).toBe('25%');
    expect(pct(500, 200)).toBe('100%');
    expect(pct(-5, 200)).toBe('0%');
  });
});
