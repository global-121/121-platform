import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { KoboImageRendererComponent } from '~/components/data-list/components/kobo-image-renderer/kobo-image-renderer.component';

@Component({
  selector: 'app-test-host',
  standalone: true,
  imports: [KoboImageRendererComponent],
  template: `
    <app-kobo-image-renderer
      [imageUrl]="imageUrl()"
      [label]="label()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestHostComponent {
  readonly imageUrl = signal('https://example.com/image.jpg');
  readonly label = signal('Photo of ID');
}

describe('KoboImageRendererComponent', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let rendererComponent: KoboImageRendererComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KoboImageRendererComponent, TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    rendererComponent = fixture.debugElement.children[0]
      .componentInstance as KoboImageRendererComponent;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('expandable behavior', () => {
    it('should render toggle button with label', () => {
      const button = (fixture.nativeElement as HTMLElement).querySelector(
        'button',
      );
      expect(button?.textContent).toContain('Photo of ID');
    });

    it('should start in collapsed state', () => {
      const expandedDiv = (fixture.nativeElement as HTMLElement).querySelector(
        '.mt-3',
      );
      expect(expandedDiv).toBeNull();
    });

    it('should expand when toggle button clicked', () => {
      const button = (fixture.nativeElement as HTMLElement).querySelector(
        'button',
      );
      button?.click();
      fixture.detectChanges();

      const expandedDiv = (fixture.nativeElement as HTMLElement).querySelector(
        '.mt-3',
      );
      expect(expandedDiv).not.toBeNull();
    });

    it('should collapse when toggle button clicked again', () => {
      const button = (fixture.nativeElement as HTMLElement).querySelector(
        'button',
      );
      button?.click();
      fixture.detectChanges();
      button?.click();
      fixture.detectChanges();

      const expandedDiv = (fixture.nativeElement as HTMLElement).querySelector(
        '.mt-3',
      );
      expect(expandedDiv).toBeNull();
    });

    it('should update aria-expanded attribute on toggle', () => {
      const button = (fixture.nativeElement as HTMLElement).querySelector(
        'button',
      );
      expect(button?.getAttribute('aria-expanded')).toBe('false');

      button?.click();
      fixture.detectChanges();
      expect(button?.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('image rendering', () => {
    it('should render image when URL is valid HTTPS', () => {
      component.imageUrl.set('https://example.com/photo.png');
      rendererComponent.toggleExpanded();
      fixture.detectChanges();

      const img = (fixture.nativeElement as HTMLElement).querySelector('img');
      expect(img?.src).toBe('https://example.com/photo.png');
    });

    it('should render image when URL is valid HTTP', () => {
      component.imageUrl.set('http://example.com/photo.jpg');
      rendererComponent.toggleExpanded();
      fixture.detectChanges();

      const img = (fixture.nativeElement as HTMLElement).querySelector('img');
      expect(img?.src).toBe('http://example.com/photo.jpg');
    });

    it('should render fallback link for invalid URL protocol', () => {
      component.imageUrl.set('ftp://example.com/photo.jpg');
      rendererComponent.toggleExpanded();
      fixture.detectChanges();

      const link = (fixture.nativeElement as HTMLElement).querySelector('a');
      expect(link?.href).toContain('ftp://example.com/photo.jpg');
      expect(link?.textContent).toContain('ftp://example.com/photo.jpg');
    });

    it('should render fallback link for malformed URL', () => {
      component.imageUrl.set('not-a-valid-url');
      rendererComponent.toggleExpanded();
      fixture.detectChanges();

      const link = (fixture.nativeElement as HTMLElement).querySelector('a');
      expect(link?.href).toContain('not-a-valid-url');
      expect(link?.textContent).toContain('not-a-valid-url');
    });
  });

  describe('image load failure handling', () => {
    it('should show fallback link when image load fails', () => {
      component.imageUrl.set('https://example.com/photo.jpg');
      rendererComponent.toggleExpanded();
      fixture.detectChanges();

      let img = (fixture.nativeElement as HTMLElement).querySelector('img');
      expect(img).not.toBeNull();

      rendererComponent.onImageLoadError();
      fixture.detectChanges();

      const link = (fixture.nativeElement as HTMLElement).querySelector('a');
      img = (fixture.nativeElement as HTMLElement).querySelector('img');
      expect(link?.href).toContain('https://example.com/photo.jpg');
      expect(img).toBeNull();
    });

    it('should reset imageLoadFailed when imageUrl changes', () => {
      component.imageUrl.set('https://example.com/photo1.jpg');
      rendererComponent.toggleExpanded();
      fixture.detectChanges();

      rendererComponent.onImageLoadError();
      fixture.detectChanges();

      let link = (fixture.nativeElement as HTMLElement).querySelector('a');
      expect(link).not.toBeNull();

      component.imageUrl.set('https://example.com/photo2.jpg');
      fixture.detectChanges();

      const img = (fixture.nativeElement as HTMLElement).querySelector('img');
      link = (fixture.nativeElement as HTMLElement).querySelector('a');
      expect(img).not.toBeNull();
      expect(link).toBeNull();
    });
  });

  describe('URL validation', () => {
    it('should accept HTTPS URLs', () => {
      expect(
        rendererComponent.isSupportedKoboImageUrl({
          imageUrl: 'https://example.com/photo.jpg',
        }),
      ).toBe(true);
    });

    it('should accept HTTP URLs', () => {
      expect(
        rendererComponent.isSupportedKoboImageUrl({
          imageUrl: 'http://example.com/photo.png',
        }),
      ).toBe(true);
    });

    it('should reject non-HTTP/HTTPS protocols', () => {
      expect(
        rendererComponent.isSupportedKoboImageUrl({
          imageUrl: 'ftp://example.com/photo.jpg',
        }),
      ).toBe(false);
    });

    it('should reject malformed URLs', () => {
      expect(
        rendererComponent.isSupportedKoboImageUrl({
          imageUrl: 'not-a-url',
        }),
      ).toBe(false);
    });

    it('should accept HTTPS URLs without file extension', () => {
      expect(
        rendererComponent.isSupportedKoboImageUrl({
          imageUrl: 'https://example.com/image',
        }),
      ).toBe(true);
    });

    it('should accept data URLs starting with https', () => {
      expect(
        rendererComponent.isSupportedKoboImageUrl({
          imageUrl: 'https://api.kobo.example.com/api/v2/assets/abc123/data/1',
        }),
      ).toBe(true);
    });
  });

  describe('badge rendering', () => {
    it('should render Available badge', () => {
      const badge = (fixture.nativeElement as HTMLElement).querySelector(
        'span',
      );
      expect(badge?.textContent).toContain('Available');
    });
  });
});
