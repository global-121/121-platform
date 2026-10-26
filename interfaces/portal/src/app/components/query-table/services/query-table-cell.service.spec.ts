import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import {
  QueryTableColumn,
  QueryTableColumnType,
} from '~/components/query-table/query-table.types';
import { QueryTableCellService } from '~/components/query-table/services/query-table-cell.service';
import { parseDateValue } from '~/utils/date';

interface TestCellItem {
  id: number;
  name: string;
  value?: number;
  dateString?: string;
}

describe('QueryTableCellService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Necessary for test-setup
  let service: QueryTableCellService<any>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        QueryTableCellService,
        { provide: LOCALE_ID, useValue: 'en-GB' },
      ],
    });

    service = TestBed.inject(QueryTableCellService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should use a custom cell-text function when provided', () => {
    const testItem = { id: 1, name: 'Test Item' };
    const customColumn: QueryTableColumn<TestCellItem> = {
      header: 'Custom',
      field: 'name',
      getCellText: (item) => `Custom: ${item.name}`,
    };

    const result = service.getCellText(customColumn, testItem);

    expect(result).toBe('Custom: Test Item');
  });

  it('should not output anything for computed fields', () => {
    const testItem = { id: 1, name: 'Test Item' };
    const computedColumn: QueryTableColumn<TestCellItem> = {
      header: 'Computed',
      field: 'COMPUTED_FIELD',
    };

    const result = service.getCellText(computedColumn, testItem);

    expect(result).toBeUndefined();
  });

  it('should handle text columns correctly', () => {
    const testItem = { id: 1, name: 'Test Item' };
    const textColumn: QueryTableColumn<TestCellItem> = {
      header: 'Name',
      field: 'name',
    };

    const result = service.getCellText(textColumn, testItem);

    expect(result).toBe('Test Item');
  });

  it('should handle numeric columns correctly', () => {
    const testItem = { id: 1, value: 42 };
    const numericColumn: QueryTableColumn<TestCellItem> = {
      header: 'Value',
      field: 'value',
      type: QueryTableColumnType.NUMERIC,
    };

    const result = service.getCellText(numericColumn, testItem);

    expect(result).toBe('42');
  });

  it('should keep zero values visible in numeric columns', () => {
    const testItem = { id: 1, value: 0 };
    const numericColumn: QueryTableColumn<TestCellItem> = {
      header: 'Value',
      field: 'value',
      type: QueryTableColumnType.NUMERIC,
    };

    const result = service.getCellText(numericColumn, testItem);

    expect(result).toBe('0');
  });

  it('should handle date columns correctly', () => {
    const testItem = { id: 1, dateString: '2023-12-25T10:30:00Z' };
    const dateColumn: QueryTableColumn<TestCellItem> = {
      header: 'Date',
      field: 'dateString',
      type: QueryTableColumnType.DATE,
    };

    const result = service.getCellText(dateColumn, testItem);

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toContain('25'); // Should contain the day part of the date
  });

  it.each([
    ['31-12-2025', new Date(2025, 11, 31)],
    ['05-06-2026', new Date(2026, 5, 5)],
    ['1-1-2026', new Date(2026, 0, 1)],
    ['29-02-2024', new Date(2024, 1, 29)],
    ['01-01-0099', new Date('0099-01-01T00:00:00')],
  ])('should display date-only value %s in day-month order', (value, date) => {
    const dateColumn: QueryTableColumn<TestCellItem> = {
      header: 'Date',
      field: 'dateString',
      type: QueryTableColumnType.DATE,
    };

    expect(service.getCellText(dateColumn, { id: 1, dateString: value })).toBe(
      service.getCellText(dateColumn, { id: 1, dateString: date }),
    );
  });

  it.each(['31-02-2026', '29-02-2025', '31-04-2026'])(
    'should reject impossible date-only input %s',
    (value) => {
      const result = parseDateValue({ value });
      expect(result).toBeInstanceOf(Date);
      expect(Number.isNaN(new Date(result).getTime())).toBe(true);
    },
  );

  it.each(['', '2026-06-05', '2026-06-05T10:30:00Z'])(
    'should preserve non-registration date input %s',
    (value) => {
      expect(parseDateValue({ value })).toBe(value);
    },
  );

  it('should return correct column type when specified', () => {
    const numericColumn: QueryTableColumn<TestCellItem> = {
      header: 'Value',
      field: 'value',
      type: QueryTableColumnType.NUMERIC,
    };

    const result = service.getColumnType(numericColumn);

    expect(result).toBe('numeric');
  });

  it('should return default type when not specified', () => {
    const defaultColumn: QueryTableColumn<TestCellItem> = {
      header: 'Name',
      field: 'name',
    };

    const result = service.getColumnType(defaultColumn);

    expect(result).toBe('text');
  });

  it('should return correct sort field when specified', () => {
    const columnWithSortField: QueryTableColumn<TestCellItem> = {
      header: 'Name',
      field: 'name',
      fieldForSort: 'value',
    };

    const result = service.getColumnSortField(columnWithSortField);

    expect(result).toBe('value');
  });

  it('should return main field when no custom sort field specified', () => {
    const defaultColumn: QueryTableColumn<TestCellItem> = {
      header: 'Name',
      field: 'name',
    };

    const result = service.getColumnSortField(defaultColumn);

    expect(result).toBe('name');
  });
});
