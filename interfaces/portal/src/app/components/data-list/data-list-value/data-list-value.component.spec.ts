import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DataListItem } from '~/components/data-list/data-list-item.type';
import { DataListValueComponent } from '~/components/data-list/data-list-value/data-list-value.component';
import { ColorVariant } from '~/utils/color-variant.enum';
import { LOCAL_STORAGE_DEBUG_DATA_LIST_KEY } from '~/utils/debug-log';

describe('DataListValueComponent', () => {
  let fixture: ComponentFixture<DataListValueComponent>;

  const renderItem = ({ item }: { item: DataListItem }): string => {
    fixture.componentRef.setInput('item', item);
    fixture.detectChanges();

    return (fixture.nativeElement as HTMLElement).textContent.trim();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataListValueComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DataListValueComponent);
  });

  afterEach(() => {
    localStorage.removeItem(LOCAL_STORAGE_DEBUG_DATA_LIST_KEY);
    vi.restoreAllMocks();
  });

  it('should render the chip when chip label and variant are set', () => {
    const text = renderItem({
      item: {
        label: 'Status',
        value: 'ignored',
        chipLabel: 'Registered',
        chipVariant: ColorVariant.Green,
      },
    });

    expect(text).toContain('Registered');
    expect(text).not.toContain('ignored');
  });

  it('should render an "Available" chip for a Kobo image with a value', () => {
    const text = renderItem({
      item: { label: 'Photo', type: 'koboImage', value: 'photo.jpg' },
    });

    expect(text).toBe('Available');
  });

  it('should render a "Not available" chip for a Kobo image without a value', () => {
    const text = renderItem({
      item: { label: 'Photo', type: 'koboImage', value: '' },
    });

    expect(text).toBe('Not available');
  });

  it('should render a skeleton instead of the value while loading', () => {
    const text = renderItem({
      item: { label: 'Name', value: 'John', loading: true },
    });

    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('p-skeleton')).not.toBeNull();
    expect(text).not.toContain('John');
  });

  it('should not render a skeleton when not loading', () => {
    renderItem({ item: { label: 'Name', value: 'John' } });

    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('p-skeleton')).toBeNull();
  });

  it('should keep the same skeleton width across re-renders', () => {
    const loadingItem: DataListItem = {
      label: 'Name',
      value: 'John',
      loading: true,
    };
    renderItem({ item: loadingItem });
    const widthBefore = fixture.componentInstance.skeletonWidth;

    renderItem({ item: { ...loadingItem } });

    expect(fixture.componentInstance.skeletonWidth).toBe(widthBefore);
  });

  it('should not log skeleton visibility when the debug flag is disabled', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {
      // silence output
    });
    const loadingItem: DataListItem = {
      label: 'Name',
      value: 'John',
      loading: true,
    };

    renderItem({ item: loadingItem });
    renderItem({ item: { ...loadingItem, loading: false } });

    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('should log skeleton visibility when the debug flag is enabled', () => {
    localStorage.setItem(LOCAL_STORAGE_DEBUG_DATA_LIST_KEY, 'true');
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {
      // silence output
    });
    const loadingItem: DataListItem = {
      label: 'Name',
      value: 'John',
      loading: true,
    };

    renderItem({ item: loadingItem });
    renderItem({ item: { ...loadingItem, loading: false } });

    expect(debugSpy).toHaveBeenCalledTimes(2);
    expect(String(debugSpy.mock.calls[0][0])).toContain('Skeleton shown');
    expect(String(debugSpy.mock.calls[1][0])).toContain('Skeleton hidden');
  });

  it('should render a dash when there is no value and no chip', () => {
    const text = renderItem({
      item: { label: 'Name', type: 'text', value: '  ' },
    });

    expect(text).toBe('—');
  });

  it('should render nothing extra when only a chip label without variant is set', () => {
    const text = renderItem({
      item: { label: 'Name', type: 'text', value: '', chipLabel: 'Only label' },
    });

    expect(text).toBe('');
  });

  it('should render "Yes" and "No" for boolean values', () => {
    expect(
      renderItem({ item: { label: 'Flag', type: 'boolean', value: true } }),
    ).toBe('Yes');
    expect(
      renderItem({ item: { label: 'Flag', type: 'boolean', value: false } }),
    ).toBe('No');
  });

  it('should render code, number and date values', () => {
    expect(
      renderItem({ item: { label: 'Code', type: 'code', value: 'ABC' } }),
    ).toBe('ABC');
    expect(
      renderItem({ item: { label: 'Count', type: 'number', value: 1234 } }),
    ).toBe('1,234');
    expect(
      renderItem({
        item: { label: 'Date', type: 'date', value: '2026-01-31T00:00:00' },
      }),
    ).toMatch(/31.*January.*2026|January.*31.*2026/);
  });

  it('should render a currency value with a narrow symbol', () => {
    expect(
      renderItem({
        item: {
          label: 'Amount',
          type: 'currency',
          value: 12.5,
          currencyCode: 'EUR',
        },
      }),
    ).toBe('€12.50');
  });

  it('should render the selected options as a comma separated list', () => {
    const text = renderItem({
      item: {
        label: 'Choice',
        type: 'options',
        value: ['a', 'b'],
        options: [
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ],
      },
    });

    expect(text).toContain('Option A');
    expect(text).toContain('Option B');
  });

  it('should render a tag per option', () => {
    renderItem({
      item: {
        label: 'Tags',
        type: 'tags',
        value: ['a', 'b'],
        options: [
          { value: 'a', label: 'Tag A' },
          { value: 'b', label: 'Tag B' },
        ],
      },
    });

    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelectorAll('p-tag').length).toBe(2);
  });

  it('should render text values as a link when a router link is set', () => {
    renderItem({
      item: { label: 'Name', value: 'John', routerLink: ['/somewhere'] },
    });

    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('a')?.textContent.trim()).toBe('John');
  });

  it('should render text values as plain text without a router link', () => {
    const text = renderItem({ item: { label: 'Name', value: 'John' } });

    expect(text).toBe('John');
  });
});
