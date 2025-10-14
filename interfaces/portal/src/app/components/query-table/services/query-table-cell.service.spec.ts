import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';

import { QueryTableColumn, QueryTableColumnType } from '../query-table.component';
import { QueryTableCellService } from './query-table-cell.service';
import { ChipData } from '~/components/colored-chip/colored-chip.helper';

type TestData = {
  id: number;
  name: string;
  value: number;
  date: Date;
  type: 'A' | 'B';
  status: string;
};

describe('QueryTableCellService', () => {
  let service: QueryTableCellService<TestData>;

  const testItem: TestData = {
    id: 1,
    name: 'Test Item',
    value: 42,
    date: new Date('2023-12-25T10:30:00Z'),
    type: 'A',
    status: 'active',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        QueryTableCellService,
        { provide: LOCALE_ID, useValue: 'en-US' },
      ],
    });

    service = TestBed.inject(QueryTableCellService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('cell text generation', () => {
    it('should return custom cell text when getCellText is provided', () => {
      // Arrange: Column with custom getCellText function
      const customColumn: QueryTableColumn<TestData> = {
        header: 'Custom',
        field: 'name',
        type: QueryTableColumnType.TEXT,
        getCellText: (item) => `Custom: ${item.name}`,
      };

      // Act: Get cell text
      const result = service.getCellText(customColumn, testItem);

      // Assert: Should use custom function
      expect(result).toBe('Custom: Test Item');
    });

    it('should return undefined for computed fields', () => {
      // Arrange: Computed field column
      const computedColumn: QueryTableColumn<TestData> = {
        header: 'Computed',
        field: 'COMPUTED_FIELD',
      };

      // Act: Get cell text
      const result = service.getCellText(computedColumn, testItem);

      // Assert: Should return undefined
      expect(result).toBeUndefined();
    });

    it('should return undefined for fields with no value', () => {
      // Arrange: Column pointing to non-existent field
      const emptyColumn: QueryTableColumn<TestData> = {
        header: 'Empty',
        field: 'nonExistent' as keyof TestData,
      };

      // Act: Get cell text
      const result = service.getCellText(emptyColumn, testItem);

      // Assert: Should return undefined
      expect(result).toBeUndefined();
    });

    it('should handle text columns correctly', () => {
      // Arrange: Simple text column
      const textColumn: QueryTableColumn<TestData> = {
        header: 'Name',
        field: 'name',
        type: QueryTableColumnType.TEXT,
      };

      // Act: Get cell text
      const result = service.getCellText(textColumn, testItem);

      // Assert: Should return the field value as string
      expect(result).toBe('Test Item');
    });

    it('should handle numeric columns correctly', () => {
      // Arrange: Numeric column
      const numericColumn: QueryTableColumn<TestData> = {
        header: 'Value',
        field: 'value',
        type: QueryTableColumnType.NUMERIC,
      };

      // Act: Get cell text
      const result = service.getCellText(numericColumn, testItem);

      // Assert: Should convert number to string
      expect(result).toBe('42');
    });

    it('should handle date columns correctly', () => {
      // Arrange: Date column
      const dateColumn: QueryTableColumn<TestData> = {
        header: 'Date',
        field: 'date',
        type: QueryTableColumnType.DATE,
      };

      // Act: Get cell text
      const result = service.getCellText(dateColumn, testItem);

      // Assert: Should format date using DatePipe (format may vary by locale)
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('2023'); // Should contain the year
    });

    it('should handle string dates correctly', () => {
      // Arrange: Date column with string date value
      const dateColumn: QueryTableColumn<TestData> = {
        header: 'Date',
        field: 'date',
        type: QueryTableColumnType.DATE,
      };
      const itemWithStringDate = { ...testItem, date: '2023-12-25' as unknown as Date };

      // Act: Get cell text
      const result = service.getCellText(dateColumn, itemWithStringDate);

      // Assert: Should handle string dates
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should throw error for invalid date types', () => {
      // Arrange: Date column with invalid date value
      const dateColumn: QueryTableColumn<TestData> = {
        header: 'Date',
        field: 'value', // Using number field for date column
        type: QueryTableColumnType.DATE,
      };
      const itemWithInvalidDate = { ...testItem, value: {} as unknown as number };

      // Act & Assert: Should throw error for invalid date
      expect(() => service.getCellText(dateColumn, itemWithInvalidDate)).toThrow();
    });

    it('should throw error for invalid text/number types', () => {
      // Arrange: Text column with object value
      const textColumn: QueryTableColumn<TestData> = {
        header: 'Name',
        field: 'date', // Using date field for text column
        type: QueryTableColumnType.TEXT,
      };

      // Act & Assert: Should throw error for non-string/number values
      expect(() => service.getCellText(textColumn, testItem)).toThrow();
    });
  });

  describe('multiselect cell handling', () => {
    const multiselectColumn: QueryTableColumn<TestData> = {
      header: 'Type',
      field: 'type',
      type: QueryTableColumnType.MULTISELECT,
      options: [
        { label: 'Type A', value: 'A', icon: 'pi pi-star' },
        { label: 'Type B', value: 'B', icon: 'pi pi-circle' },
      ],
    };

    it('should return correct label for multiselect values', () => {
      // Act: Get cell text for multiselect
      const result = service.getCellText(multiselectColumn, testItem);

      // Assert: Should return the label, not the value
      expect(result).toBe('Type A');
    });

    it('should return undefined when multiselect value not found in options', () => {
      // Arrange: Item with value not in options
      const itemWithInvalidType = { ...testItem, type: 'C' as 'A' | 'B' };

      // Act: Get cell text
      const result = service.getCellText(multiselectColumn, itemWithInvalidType);

      // Assert: Should return undefined for unknown values
      expect(result).toBeUndefined();
    });

    it('should return correct icon for multiselect values', () => {
      // Act: Get multiselect cell icon
      const result = service.getMultiSelectCellIcon(multiselectColumn, testItem);

      // Assert: Should return the icon for the value
      expect(result).toBe('pi pi-star');
    });

    it('should return undefined icon when value not found', () => {
      // Arrange: Item with value not in options
      const itemWithInvalidType = { ...testItem, type: 'C' as 'A' | 'B' };

      // Act: Get multiselect cell icon
      const result = service.getMultiSelectCellIcon(multiselectColumn, itemWithInvalidType);

      // Assert: Should return undefined for unknown values
      expect(result).toBeUndefined();
    });

    it('should return undefined icon when cell value is empty', () => {
      // Arrange: Item with empty value
      const itemWithEmptyType = { ...testItem, type: undefined as unknown as 'A' | 'B' };

      // Act: Get multiselect cell icon
      const result = service.getMultiSelectCellIcon(multiselectColumn, itemWithEmptyType);

      // Assert: Should return undefined for empty values
      expect(result).toBeUndefined();
    });

    it('should handle custom chip data when provided', () => {
      // Arrange: Column with custom chip data function
      const chipDataColumn: QueryTableColumn<TestData> & {
        type: QueryTableColumnType.MULTISELECT;
        getCellChipData?: (item: TestData) => ChipData;
      } = {
        ...multiselectColumn,
        getCellChipData: (item) => ({ color: 'blue', label: `Chip: ${item.type}` }),
      };

      // Act: Get cell chip data
      const result = service.getCellChipData(chipDataColumn, testItem);

      // Assert: Should return custom chip data
      expect(result).toEqual({ color: 'blue', label: 'Chip: A' });
    });

    it('should return undefined when no custom chip data function provided', () => {
      // Act: Get cell chip data without custom function
      const result = service.getCellChipData(multiselectColumn, testItem);

      // Assert: Should return undefined
      expect(result).toBeUndefined();
    });
  });

  describe('column type and sorting utilities', () => {
    it('should return correct column type when specified', () => {
      // Arrange: Column with specific type
      const numericColumn: QueryTableColumn<TestData> = {
        header: 'Value',
        field: 'value',
        type: QueryTableColumnType.NUMERIC,
      };

      // Act: Get column type
      const result = service.getColumnType(numericColumn);

      // Assert: Should return the specified type
      expect(result).toBe(QueryTableColumnType.NUMERIC);
    });

    it('should default to TEXT type when not specified', () => {
      // Arrange: Column without type
      const defaultColumn: QueryTableColumn<TestData> = {
        header: 'Name',
        field: 'name',
      };

      // Act: Get column type
      const result = service.getColumnType(defaultColumn);

      // Assert: Should default to TEXT
      expect(result).toBe(QueryTableColumnType.TEXT);
    });

    it('should return correct sort field when specified', () => {
      // Arrange: Column with custom sort field
      const columnWithSortField: QueryTableColumn<TestData> = {
        header: 'Name',
        field: 'name',
        fieldForSort: 'value',
      };

      // Act: Get sort field
      const result = service.getColumnSortField(columnWithSortField);

      // Assert: Should return custom sort field
      expect(result).toBe('value');
    });

    it('should return main field when no custom sort field specified', () => {
      // Arrange: Column without custom sort field
      const defaultColumn: QueryTableColumn<TestData> = {
        header: 'Name',
        field: 'name',
      };

      // Act: Get sort field
      const result = service.getColumnSortField(defaultColumn);

      // Assert: Should return main field
      expect(result).toBe('name');
    });

    it('should return undefined for computed fields', () => {
      // Arrange: Computed field column
      const computedColumn: QueryTableColumn<TestData> = {
        header: 'Computed',
        field: 'COMPUTED_FIELD',
      };

      // Act: Get sort field
      const result = service.getColumnSortField(computedColumn);

      // Assert: Should return undefined for computed fields
      expect(result).toBeUndefined();
    });

    it('should return undefined when sorting is disabled', () => {
      // Arrange: Column with sorting disabled
      const disabledSortColumn: QueryTableColumn<TestData> = {
        header: 'Name',
        field: 'name',
        disableSorting: true,
      };

      // Act: Get sort field
      const result = service.getColumnSortField(disabledSortColumn);

      // Assert: Should return undefined when sorting disabled
      expect(result).toBeUndefined();
    });
  });

  describe('nested field access', () => {
    it('should handle nested object field access', () => {
      // Arrange: Item with nested structure and column using radashi.get
      const nestedItem = {
        id: 1,
        user: { profile: { name: 'John Doe' } },
      };
      const nestedColumn: QueryTableColumn<typeof nestedItem> = {
        header: 'User Name',
        field: 'user.profile.name' as keyof typeof nestedItem,
      };

      // Act: Get cell text (this tests the private getCellValue method indirectly)
      const result = service.getCellText(nestedColumn, nestedItem);

      // Assert: Should access nested property
      expect(result).toBe('John Doe');
    });
  });
});