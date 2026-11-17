import { describe, expect, it } from 'vitest';

import {
  filterMentionItems,
  findActiveMention,
  formatPlaceholder,
} from '~/pages/program-registrations/components/custom-message-control/custom-message-mention.helper';

describe('custom message mention helper', () => {
  describe('findActiveMention', () => {
    it('should find a mention at the start of the text', () => {
      expect(findActiveMention({ text: '@na', caretPosition: 3 })).toEqual({
        startIndex: 0,
        query: 'na',
      });
    });

    it('should find a mention after whitespace', () => {
      expect(
        findActiveMention({ text: 'Hello @na', caretPosition: 9 }),
      ).toEqual({ startIndex: 6, query: 'na' });
    });

    it('should return nothing without trigger character', () => {
      expect(findActiveMention({ text: 'Hello', caretPosition: 5 })).toBe(
        undefined,
      );
    });

    it('should return nothing when trigger is part of a word', () => {
      expect(
        findActiveMention({ text: 'mail@example', caretPosition: 12 }),
      ).toBe(undefined);
    });

    it('should return nothing when whitespace follows the query', () => {
      expect(findActiveMention({ text: '@name and', caretPosition: 9 })).toBe(
        undefined,
      );
    });
  });

  describe('filterMentionItems', () => {
    const items = [{ label: 'Full name' }, { label: 'Phone number' }];

    it('should match case-insensitively', () => {
      expect(filterMentionItems({ items, query: 'NAME' })).toEqual([
        { label: 'Full name' },
      ]);
    });

    it('should return all items for an empty query', () => {
      expect(filterMentionItems({ items, query: '' })).toEqual(items);
    });
  });

  it('formatPlaceholder should wrap the name in braces', () => {
    expect(formatPlaceholder({ name: 'fullName' })).toBe('{{fullName}} ');
  });
});
