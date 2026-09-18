import { describe, expect, it } from 'vitest';
import { createLayout, digitCount } from '../src/core/layout';

describe('digitCount', () => {
  it('counts decimal digits', () => {
    expect([1, 9, 10, 99, 100, 123456].map(digitCount)).toEqual([1, 1, 2, 2, 3, 6]);
  });
});

describe('createLayout', () => {
  const layout = createLayout(100, [22, 30, 38], 0);

  it('sums widths per digit tier', () => {
    expect(layout.offsetOf(1)).toBe(0);
    expect(layout.offsetOf(9)).toBe(8 * 22);
    expect(layout.offsetOf(10)).toBe(9 * 22);
    // 1–9 at 22px, then 10–14 at 30px
    expect(layout.offsetOf(15)).toBe(9 * 22 + 5 * 30);
    expect(layout.offsetOf(100)).toBe(9 * 22 + 90 * 30);
    expect(layout.contentWidth).toBe(9 * 22 + 90 * 30 + 38);
  });

  it('returns the width of each tier', () => {
    expect([1, 10, 99, 100].map(layout.widthOf)).toEqual([22, 30, 30, 38]);
  });

  it('maps x back to the page whose slot contains it', () => {
    expect(layout.pageAt(-500)).toBe(1);
    expect(layout.pageAt(0)).toBe(1);
    expect(layout.pageAt(21.9)).toBe(1);
    expect(layout.pageAt(22)).toBe(2);
    expect(layout.pageAt(9 * 22)).toBe(10);
    expect(layout.pageAt(9 * 22 + 5 * 30 + 1)).toBe(15);
    expect(layout.pageAt(layout.offsetOf(100))).toBe(100);
    expect(layout.pageAt(1e9)).toBe(100);
  });

  it('is the inverse of offsetOf for every page', () => {
    for (let page = 1; page <= 100; page++) expect(layout.pageAt(layout.offsetOf(page))).toBe(page);
  });

  it('includes the gap in each step but not after the last page', () => {
    const gapped = createLayout(12, [20, 28], 4);
    expect(gapped.offsetOf(2)).toBe(24);
    expect(gapped.offsetOf(10)).toBe(9 * 24);
    expect(gapped.offsetOf(12)).toBe(9 * 24 + 2 * 32);
    expect(gapped.contentWidth).toBe(9 * 24 + 2 * 32 + 28);
    expect(gapped.pageAt(22)).toBe(1);
  });

  it('supports negative gaps (collapsed borders)', () => {
    const collapsed = createLayout(3, [30], -1);
    expect(collapsed.offsetOf(3)).toBe(58);
    expect(collapsed.contentWidth).toBe(88);
  });

  it('stays O(digits) for huge totals', () => {
    const huge = createLayout(10_000_000, [20, 28, 36, 44, 52, 60, 68, 76], 0);
    const page = 7_654_321;
    expect(huge.pageAt(huge.offsetOf(page))).toBe(page);
    expect(huge.pageAt(huge.offsetOf(page) - 1)).toBe(page - 1);
  });
});
