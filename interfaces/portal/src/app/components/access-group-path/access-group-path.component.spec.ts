import { TestBed } from '@angular/core/testing';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AccessGroupPathComponent } from '~/components/access-group-path/access-group-path.component';

describe('Access group path', () => {
  let originalDirection: string;

  beforeEach(async () => {
    originalDirection = document.documentElement.dir;
    await TestBed.configureTestingModule({
      imports: [AccessGroupPathComponent],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.dir = originalDirection;
  });

  it.each([
    { labels: [] },
    { labels: ['North-Holland'] },
    { labels: ['North-Holland', 'Haarlem', 'Centrum'] },
  ])(
    'isolates each label and renders a separator only between labels ($labels)',
    ({ labels }) => {
      // Arrange
      const fixture = TestBed.createComponent(AccessGroupPathComponent);
      fixture.componentRef.setInput('labels', labels);

      // Act
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;

      // Assert
      expect(
        Array.from(
          element.querySelectorAll('bdi:not([dir])'),
          (label) => label.textContent,
        ),
      ).toEqual(labels);
      expect(element.querySelectorAll('bdi[dir]')).toHaveLength(
        Math.max(0, labels.length - 1),
      );
    },
  );

  it.each([
    { direction: 'ltr', separator: '>' },
    { direction: 'rtl', separator: '<' },
  ])(
    'uses the correct separator direction in $direction mode',
    ({ direction, separator }) => {
      // Arrange
      document.documentElement.dir = direction;
      const fixture = TestBed.createComponent(AccessGroupPathComponent);
      fixture.componentRef.setInput('labels', ['North-Holland', 'Haarlem']);

      // Act
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;

      // Assert
      const renderedSeparator = element.querySelector('bdi[dir]');
      expect(renderedSeparator?.getAttribute('dir')).toBe(direction);
      expect(renderedSeparator?.textContent).toBe(separator);
    },
  );
});
