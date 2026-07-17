import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import { ImageListComponent } from '~/components/image-list/image-list.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';

interface KoboImageItem {
  label: string | UILanguageTranslation;
  imageUrl: string;
  programId?: number | string;
  referenceId?: string;
  attributeName?: string;
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
      programId: 1,
      referenceId: '2e9f0191-7687-4172-acfd-e66b14ffa7df',
      attributeName: 'upload_an_image',
      dataTestId: 'kobo-image-photo-of-id',
    },
    {
      label: 'Copy of passport',
      imageUrl: 'https://example.org/photo-2.jpg',
      programId: 1,
      referenceId: '2e9f0191-7687-4172-acfd-e66b14ffa7df',
      attributeName: 'upload_an_image_copy',
      dataTestId: 'kobo-image-copy-of-passport',
    },
  ]);
}

describe('ImageListComponent', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let rendererComponent: ImageListComponent;
  const downloadedBlob = new Blob(['image-file']);
  const downloadKoboImage = vi.fn().mockResolvedValue(downloadedBlob);
  const createObjectUrl = vi
    .spyOn(URL, 'createObjectURL')
    .mockReturnValue('blob:https://example.org/kobo-image');
  const revokeObjectUrl = vi
    .spyOn(URL, 'revokeObjectURL')
    .mockImplementation(() => undefined);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageListComponent, TestHostComponent],
      providers: [
        {
          provide: RegistrationApiService,
          useValue: {
            downloadKoboImage,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    rendererComponent = fixture.debugElement.children[0]
      .componentInstance as ImageListComponent;
    fixture.detectChanges();

    downloadKoboImage.mockClear();
    createObjectUrl.mockClear();
    revokeObjectUrl.mockClear();
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

  it('renders images by default for provided URLs', () => {
    hostComponent.images.set([
      { label: 'Valid', imageUrl: 'https://example.org/valid.jpg' },
      { label: 'Other', imageUrl: 'https://example.org/other.jpg' },
    ]);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const images = root.querySelectorAll('img');
    const links = root.querySelectorAll('a');

    expect(images.length).toBe(2);
    expect(images[0].getAttribute('src')).toBe('https://example.org/valid.jpg');
    expect(images[1].getAttribute('src')).toBe('https://example.org/other.jpg');
    expect(links.length).toBe(0);
  });

  it('updates rendered images when images input changes', () => {
    hostComponent.images.set([
      { label: 'Image one', imageUrl: 'https://example.org/photo-1.jpg' },
      { label: 'Image two', imageUrl: 'https://example.org/photo-2.jpg' },
    ]);
    fixture.detectChanges();

    let root = fixture.nativeElement as HTMLElement;
    let images = root.querySelectorAll('img');

    expect(images.length).toBe(2);
    expect(images[0].getAttribute('src')).toBe(
      'https://example.org/photo-1.jpg',
    );
    expect(images[1].getAttribute('src')).toBe(
      'https://example.org/photo-2.jpg',
    );

    hostComponent.images.set([
      { label: 'Image one', imageUrl: 'https://example.org/photo-1.jpg' },
    ]);
    fixture.detectChanges();

    root = fixture.nativeElement as HTMLElement;
    images = root.querySelectorAll('img');

    expect(images.length).toBe(1);
    expect(images[0].getAttribute('src')).toBe(
      'https://example.org/photo-1.jpg',
    );
  });

  it('returns false for empty image URL rendering guard', () => {
    expect(rendererComponent.isImageAvailable({ imageUrl: '' })).toBe(false);
  });

  it('shows Not available badge for empty image URL and keeps only available image rendered', () => {
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
    expect(root.querySelectorAll('img').length).toBe(1);
    expect(root.querySelectorAll('a').length).toBe(0);
  });

  it('downloads image from API and uses object URL when header is clicked', async () => {
    const root = fixture.nativeElement as HTMLElement;
    const header = root.querySelector('p-accordion-header');

    if (!header) {
      throw new Error('Expected image accordion header to render');
    }

    header.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();

    expect(downloadKoboImage).toHaveBeenCalledWith({
      programId: 1,
      referenceId: '2e9f0191-7687-4172-acfd-e66b14ffa7df',
      attributeName: 'upload_an_image',
    });
    expect(createObjectUrl).toHaveBeenCalledWith(downloadedBlob);
    expect(rendererComponent.downloadedImageObjectUrls()[0]).toBe(
      'blob:https://example.org/kobo-image',
    );
    expect(rendererComponent.objectUrlForImageIndex({ index: 0 })).toBe(
      'blob:https://example.org/kobo-image',
    );
    expect(revokeObjectUrl).not.toHaveBeenCalled();
  });

  it('does not re-download when image for index is already downloaded', async () => {
    const root = fixture.nativeElement as HTMLElement;
    const header = root.querySelector('p-accordion-header');

    if (!header) {
      throw new Error('Expected image accordion header to render');
    }

    header.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();

    header.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();

    expect(downloadKoboImage).toHaveBeenCalledTimes(1);
  });
});
