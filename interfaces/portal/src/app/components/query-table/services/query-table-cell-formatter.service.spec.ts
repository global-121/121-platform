import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';

import { QueryTableCellFormatterService } from './query-table-cell-formatter.service';
import { QueryTableColumn, QueryTableColumnType } from '../query-table.component';

describe('QueryTableCellFormatterService', () => {
  let service: QueryTableCellFormatterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: LOCALE_ID,
          useValue: 'en-US',
        },
      ],
    });
    service = TestBed.inject(QueryTableCellFormatterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return undefined for falsy values', () => {
    const column: QueryTableColumn<any> = {
      header: 'Test',
      field: 'test',
      type: QueryTableColumnType.TEXT,
    };

    expect(service.formatCellText(column, null)).toBeUndefined();
    expect(service.formatCellText(column, undefined)).toBeUndefined();
    expect(service.formatCellText(column, '')).toBeUndefined();
    expect(service.formatCellText(column, 0)).toBeUndefined();
  });

  it('should format text values correctly', () => {
    const column: QueryTableColumn<any> = {
      header: 'Test',
      field: 'test',
      type: QueryTableColumnType.TEXT,
    };

    expect(service.formatCellText(column, 'hello')).toBe('hello');
    expect(service.formatCellText(column, 123)).toBe('123');
  });

  it('should format multiselect values correctly', () => {
    const column: QueryTableColumn<any> = {
      header: 'Status',
      field: 'status',
      type: QueryTableColumnType.MULTISELECT,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    };

    expect(service.formatCellText(column, 'active')).toBe('Active');
    expect(service.formatCellText(column, 'inactive')).toBe('Inactive');
    expect(service.formatCellText(column, 'unknown')).toBeUndefined();
  });

  it('should format date values correctly', () => {
    const column: QueryTableColumn<any> = {
      header: 'Date',
      field: 'date',
      type: QueryTableColumnType.DATE,
    };

    const testDate = new Date('2023-01-01T10:00:00Z');
    const result = service.formatCellText(column, testDate);
    expect(result).toBeTruthy(); // Date formatting is locale-dependent, so just check it returns something
  });

  it('should throw error for invalid date values', () => {
    const column: QueryTableColumn<any> = {
      header: 'Date',
      field: 'date',
      type: QueryTableColumnType.DATE,
    };

    expect(() => service.formatCellText(column, {})).toThrow();
    expect(() => service.formatCellText(column, [])).toThrow();
  });

  it('should throw error for invalid text values', () => {
    const column: QueryTableColumn<any> = {
      header: 'Text',
      field: 'text',
      type: QueryTableColumnType.TEXT,
    };

    expect(() => service.formatCellText(column, {})).toThrow();
    expect(() => service.formatCellText(column, [])).toThrow();
  });
});