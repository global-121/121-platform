import { DataListItem } from '~/components/data-list/data-list-item.type';

export interface DataListItemEdgeFlags {
  isFirstItem: boolean;
  isLastItem: boolean;
  isInFirstWideScreenRow: boolean;
  isInLastWideScreenRow: boolean;
}

export const determineDataListItemEdgeFlags = ({
  items,
  forceOneColumn,
}: {
  items: DataListItem[];
  forceOneColumn: boolean;
}): DataListItemEdgeFlags[] => {
  const rowIndexes = determineWideScreenRowIndexes({ items, forceOneColumn });
  const lastRowIndex = Math.max(...rowIndexes, 0);

  return rowIndexes.map((rowIndex, index) => ({
    isFirstItem: index === 0,
    isLastItem: index === rowIndexes.length - 1,
    isInFirstWideScreenRow: rowIndex === 0,
    isInLastWideScreenRow: rowIndex === lastRowIndex,
  }));
};

const determineWideScreenRowIndexes = ({
  items,
  forceOneColumn,
}: {
  items: DataListItem[];
  forceOneColumn: boolean;
}): number[] => {
  const columnCount = forceOneColumn ? 1 : 2;
  const rowIndexes: number[] = [];
  let rowIndex = 0;
  let column = 0;

  for (const item of items) {
    const isFullRow = item.fullWidth === true || columnCount === 1;

    if (isFullRow && column !== 0) {
      rowIndex++;
      column = 0;
    }

    rowIndexes.push(rowIndex);

    column = isFullRow ? columnCount : column + 1;

    if (column >= columnCount) {
      rowIndex++;
      column = 0;
    }
  }

  return rowIndexes;
};
