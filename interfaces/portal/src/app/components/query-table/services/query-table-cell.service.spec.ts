/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions -- Test file requires any types for mocking */
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { QueryTableCellService } from '~/components/query-table/services/query-table-cell.service';

describe('QueryTableCellService', () => {
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

  it('should return custom cell text when getCellText is provided', () => {
    const testItem = { id: 1, name: 'Test Item' };
    const customColumn: any = {
      header: 'Custom',
      field: 'name',
      type: 'text',
      getCellText: (item: any) => `Custom: ${item.name}`,
    };

    const result = service.getCellText(customColumn, testItem);

    expect(result).toBe('Custom: Test Item');
  });

  it('should return undefined for computed fields', () => {
    const testItem = { id: 1, name: 'Test Item' };
    const computedColumn: any = {
      header: 'Computed',
      field: 'COMPUTED_FIELD',
    };

    const result = service.getCellText(computedColumn, testItem);

    expect(result).toBeUndefined();
  });

  it('should handle text columns correctly', () => {
    const testItem = { id: 1, name: 'Test Item' };
    const textColumn: any = {
      header: 'Name',
      field: 'name',
      type: 'text',
    };

    const result = service.getCellText(textColumn, testItem);

    expect(result).toBe('Test Item');
  });

  it('should handle numeric columns correctly', () => {
    const testItem = { id: 1, value: 42 };
    const numericColumn: any = {
      header: 'Value',
      field: 'value',
      type: 'numeric',
    };

    const result = service.getCellText(numericColumn, testItem);

    expect(result).toBe('42');
  });

  it('should handle date columns correctly', () => {
    const testItem = { id: 1, dateString: '2023-12-25T10:30:00Z' };
    const dateColumn: any = {
      header: 'Date',
      field: 'dateString',
      type: 'date',
    };

    const result = service.getCellText(dateColumn, testItem);

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toContain('25'); // Should contain the day part of the date
  });

  it('should return correct column type when specified', () => {
    const numericColumn: any = {
      header: 'Value',
      field: 'value',
      type: 'numeric',
    };

    const result = service.getColumnType(numericColumn);

    expect(result).toBe('numeric');
  });

  it('should default to TEXT type when not specified', () => {
    const defaultColumn: any = {
      header: 'Name',
      field: 'name',
    };

    const result = service.getColumnType(defaultColumn);

    expect(result).toBe('text');
  });

  it('should return correct sort field when specified', () => {
    const columnWithSortField: any = {
      header: 'Name',
      field: 'name',
      fieldForSort: 'value',
    };

    const result = service.getColumnSortField(columnWithSortField);

    expect(result).toBe('value');
  });

  it('should return main field when no custom sort field specified', () => {
    const defaultColumn: any = {
      header: 'Name',
      field: 'name',
    };

    const result = service.getColumnSortField(defaultColumn);

    expect(result).toBe('name');
  });
});
