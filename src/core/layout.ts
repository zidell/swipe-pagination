export interface Layout {
  readonly total: number;
  /** Width of all page items laid out in a row, without side margins. */
  readonly contentWidth: number;
  /** Left edge of a page, relative to the first page. */
  offsetOf(page: number): number;
  widthOf(page: number): number;
  /** Page whose slot (item + following gap) contains `x`. Clamped to 1..total. */
  pageAt(x: number): number;
}

interface Tier {
  first: number;
  last: number;
  width: number;
  step: number;
  start: number;
}

export function digitCount(page: number): number {
  return String(page).length;
}

/**
 * Pages with the same digit count share one width, so a page's position is a
 * sum over at most `digitCount(total)` tiers instead of over every page.
 * `widths[d - 1]` is the item width for d-digit pages.
 */
export function createLayout(total: number, widths: readonly number[], gap: number): Layout {
  const tiers: Tier[] = [];
  let start = 0;
  for (let digits = 1; digits <= digitCount(total); digits++) {
    const first = 10 ** (digits - 1);
    const last = Math.min(10 ** digits - 1, total);
    const width = widths[digits - 1];
    const step = width + gap;
    tiers.push({ first, last, width, step, start });
    start += (last - first + 1) * step;
  }

  const tierOf = (page: number) => tiers[digitCount(page) - 1];
  const offsetOf = (page: number) => {
    const tier = tierOf(page);
    return tier.start + (page - tier.first) * tier.step;
  };
  const widthOf = (page: number) => tierOf(page).width;

  return {
    total,
    contentWidth: offsetOf(total) + widthOf(total),
    offsetOf,
    widthOf,
    pageAt(x) {
      for (const tier of tiers) {
        if (x < tier.start + (tier.last - tier.first + 1) * tier.step) {
          return Math.max(tier.first, tier.first + Math.floor((x - tier.start) / tier.step));
        }
      }
      return total;
    },
  };
}
