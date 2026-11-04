import { describe, expect, it } from 'vitest';

import { determineDataListItemEdgeFlags } from '~/components/data-list/data-list-edge-flags.helper';
import { DataListItem } from '~/components/data-list/data-list-item.type';

const createItems = ({
  count,
  fullWidthIndexes = [],
}: {
  count: number;
  fullWidthIndexes?: number[];
}): DataListItem[] =>
  Array.from({ length: count }, (_, index) => ({
    label: `Item ${index.toString()}`,
    value: 'value',
    fullWidth: fullWidthIndexes.includes(index),
  }));

describe('determineDataListItemEdgeFlags', () => {
  it('should return no flags for an empty list', () => {
    expect(
      determineDataListItemEdgeFlags({ items: [], forceOneColumn: false }),
    ).toEqual([]);
  });

  it('should place items in two columns by default', () => {
    const flags = determineDataListItemEdgeFlags({
      items: createItems({ count: 4 }),
      forceOneColumn: false,
    });

    expect(flags.map((flag) => flag.isInFirstWideScreenRow)).toEqual([
      true,
      true,
      false,
      false,
    ]);
    expect(flags.map((flag) => flag.isInLastWideScreenRow)).toEqual([
      false,
      false,
      true,
      true,
    ]);
    expect(flags.map((flag) => flag.isFirstItem)).toEqual([
      true,
      false,
      false,
      false,
    ]);
    expect(flags.map((flag) => flag.isLastItem)).toEqual([
      false,
      false,
      false,
      true,
    ]);
  });

  it('should put every item in its own row when forcing one column', () => {
    const flags = determineDataListItemEdgeFlags({
      items: createItems({ count: 3 }),
      forceOneColumn: true,
    });

    expect(flags.map((flag) => flag.isInFirstWideScreenRow)).toEqual([
      true,
      false,
      false,
    ]);
    expect(flags.map((flag) => flag.isInLastWideScreenRow)).toEqual([
      false,
      false,
      true,
    ]);
  });

  it('should give a full width item its own row and move it off a half-filled row', () => {
    const flags = determineDataListItemEdgeFlags({
      items: createItems({ count: 3, fullWidthIndexes: [1] }),
      forceOneColumn: false,
    });

    expect(flags.map((flag) => flag.isInFirstWideScreenRow)).toEqual([
      true,
      false,
      false,
    ]);
    expect(flags.map((flag) => flag.isInLastWideScreenRow)).toEqual([
      false,
      false,
      true,
    ]);
  });
});
