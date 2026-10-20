import { describe, expect, it } from 'vitest';
import { hasPracticeRecord, parseOfferingKind } from '../../src/lib/offering';

describe('parseOfferingKind', () => {
  it('accepts each known offering and rejects everything else', () => {
    expect(parseOfferingKind('cupping')).toBe('cupping');
    expect(parseOfferingKind('brew101')).toBe('brew101');
    expect(parseOfferingKind('barista101')).toBe('barista101');
    [undefined, null, '', 'Cupping', 'barista', 7, {}].forEach((value) => expect(parseOfferingKind(value)).toBeNull());
  });
});

describe('hasPracticeRecord', () => {
  it('is true only for Brew 101 and sessions seeded before offeringId existed', () => {
    expect(hasPracticeRecord('brew101')).toBe(true);
    expect(hasPracticeRecord(null)).toBe(true);
    expect(hasPracticeRecord(undefined)).toBe(true);
    expect(hasPracticeRecord('cupping')).toBe(false);
    expect(hasPracticeRecord('barista101')).toBe(false);
  });
});
