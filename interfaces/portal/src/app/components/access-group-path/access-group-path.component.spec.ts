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
    'isolates each label and renders a chevron only between labels ($labels)',
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
          element.querySelectorAll('bdi'),
          (label) => label.textContent,
        ),
      ).toEqual(labels);
      expect(element.querySelectorAll('i')).toHaveLength(
        Math.max(0, labels.length - 1),
      );
      expect(element.querySelectorAll('i[aria-hidden="true"]')).toHaveLength(
        Math.max(0, labels.length - 1),
      );
    },
  );

  it.each([
    { direction: 'ltr', chevronClass: 'pi-chevron-right' },
    { direction: 'rtl', chevronClass: 'pi-chevron-left' },
  ])('points chevrons forward in $direction', ({ direction, chevronClass }) => {
    // Arrange
    document.documentElement.dir = direction;
    const fixture = TestBed.createComponent(AccessGroupPathComponent);
    fixture.componentRef.setInput('labels', ['North-Holland', 'Haarlem']);

    // Act
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    // Assert
    expect(element.querySelector('i')?.classList).toContain(chevronClass);
  });
});
