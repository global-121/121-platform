import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import { ImageListComponent } from '~/components/image-list/image-list.component';

interface KoboImageItem {
  label: string | UILanguageTranslation;
  imageUrl: string;
  dataTestId?: string;
}

@Component({
  selector: 'app-test-host',
  standalone: true,
  imports: [ImageListComponent],
  template: ` <app-image-list [images]="images()" /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestHostComponent {
  readonly images = signal<KoboImageItem[]>([
    {
      label: 'Photo of ID',
      imageUrl: 'https://example.org/photo-1.jpg',
      dataTestId: 'kobo-image-photo-of-id',
    },
    {
      label: 'Copy of passport',
      imageUrl: 'https://example.org/photo-2.jpg',
      dataTestId: 'kobo-image-copy-of-passport',
    },
  ]);
}

describe('ImageListComponent', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let rendererComponent: ImageListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageListComponent, TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    rendererComponent = fixture.debugElement.children[0]
      .componentInstance as ImageListComponent;
    fixture.detectChanges();
  });

  it('renders one accordion panel per image and shows labels/badges', () => {
    const root = fixture.nativeElement as HTMLElement;
    const panels = root.querySelectorAll('p-accordion-panel');
    const headerText = Array.from(root.querySelectorAll('p-accordion-header'))
      .map((header) => header.textContent)
      .join(' ');
    const icons = root.querySelectorAll('.pi.pi-image');

    expect(panels.length).toBe(2);
    expect(icons.length).toBe(2);
    expect(headerText).toContain('Photo of ID');
    expect(headerText).toContain('Copy of passport');
    expect(headerText).toContain('Available');
  });

  it('renders links by default for provided URLs', () => {
    hostComponent.images.set([
      { label: 'Valid', imageUrl: 'https://example.org/valid.jpg' },
      { label: 'Other', imageUrl: 'https://example.org/other.jpg' },
    ]);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const images = root.querySelectorAll('img');
    const links = root.querySelectorAll('a');

    expect(images.length).toBe(0);
    expect(links.length).toBe(2);
    expect(links[0].getAttribute('href')).toBe('https://example.org/valid.jpg');
    expect(links[1].getAttribute('href')).toBe('https://example.org/other.jpg');
  });

  it('updates rendered links when images input changes', () => {
    hostComponent.images.set([
      { label: 'Image one', imageUrl: 'https://example.org/photo-1.jpg' },
      { label: 'Image two', imageUrl: 'https://example.org/photo-2.jpg' },
    ]);
    fixture.detectChanges();

    let root = fixture.nativeElement as HTMLElement;
    let links = root.querySelectorAll('a');

    expect(links.length).toBe(2);
    expect(links[0].textContent).toContain('https://example.org/photo-1.jpg');
    expect(links[1].textContent).toContain('https://example.org/photo-2.jpg');

    hostComponent.images.set([
      { label: 'Image one', imageUrl: 'https://example.org/photo-1.jpg' },
    ]);
    fixture.detectChanges();

    root = fixture.nativeElement as HTMLElement;
    links = root.querySelectorAll('a');

    expect(links.length).toBe(1);
    expect(links[0].textContent).toContain('https://example.org/photo-1.jpg');
  });

  it('returns false for empty image URL rendering guard', () => {
    expect(rendererComponent.shouldRenderImage({ imageUrl: '' })).toBe(false);
  });

  it('shows Not available badge for empty image URL and skips link rendering', () => {
    hostComponent.images.set([
      { label: 'Signature', imageUrl: '' },
      { label: 'Photo of ID', imageUrl: 'https://example.org/valid.jpg' },
    ]);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const headerText = Array.from(root.querySelectorAll('p-accordion-header'))
      .map((header) => header.textContent)
      .join(' ');

    expect(headerText).toContain('Not available');
    expect(root.querySelectorAll('img').length).toBe(0);
    expect(root.querySelectorAll('a').length).toBe(1);
  });
});
