import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import { ImageModalsComponent } from '~/components/image/image-modals/image-modals.component';
import { ImageViewerService } from '~/components/image/services/image-viewer.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';

interface KoboImageItem {
  label: string | UILanguageTranslation;
  imageUrl: string;
  programId?: number | string;
  referenceId?: string;
  attributeName?: string;
  dataTestId?: string;
}

const referenceId = '2e9f0191-7687-4172-acfd-e66b14ffa7df';
const firstImageUrl = 'https://example.org/photo-1.jpg';
const secondImageUrl = 'https://example.org/photo-2.jpg';

@Component({
  selector: 'app-test-host',
  standalone: true,
  imports: [ImageModalsComponent],
  template: ` <app-image-modals [images]="images()" /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestHostComponent {
  readonly images = signal<KoboImageItem[]>([
    {
      label: 'Photo of ID',
      imageUrl: firstImageUrl,
      programId: 1,
      referenceId,
      attributeName: 'upload_an_image',
      dataTestId: 'kobo-image-photo-of-id',
    },
    {
      label: 'Copy of passport',
      imageUrl: secondImageUrl,
      programId: 1,
      referenceId,
      attributeName: 'upload_an_image_copy',
      dataTestId: 'kobo-image-copy-of-passport',
    },
  ]);
}

describe('ImageModalsComponent', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let imageModalsComponent: ImageModalsComponent;
  let imageViewerService: ImageViewerService;
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
      imports: [ImageModalsComponent, TestHostComponent],
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
    imageModalsComponent = fixture.debugElement.children[0]
      .componentInstance as ImageModalsComponent;
    imageViewerService = TestBed.inject(ImageViewerService);
    fixture.detectChanges();

    downloadKoboImage.mockClear();
    createObjectUrl.mockClear();
    revokeObjectUrl.mockClear();
  });

  it('renders one dialog per available image', () => {
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelectorAll('p-dialog').length).toBe(2);
  });

  it('does not render a dialog for unavailable image URLs', () => {
    hostComponent.images.set([
      { label: 'Signature', imageUrl: '' },
      { label: 'Photo of ID', imageUrl: firstImageUrl },
    ]);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelectorAll('p-dialog').length).toBe(1);
  });

  it('treats empty and "null" URLs as unavailable', () => {
    expect(imageModalsComponent.isImageAvailable({ imageUrl: '' })).toBe(false);
    expect(imageModalsComponent.isImageAvailable({ imageUrl: 'null' })).toBe(
      false,
    );
    expect(
      imageModalsComponent.isImageAvailable({ imageUrl: firstImageUrl }),
    ).toBe(true);
  });

  it('derives visible dialogs from the shared image viewer service', () => {
    expect(imageModalsComponent.openImageIndexes().size).toBe(0);

    imageViewerService.open({ imageUrl: secondImageUrl });
    fixture.detectChanges();

    expect(imageModalsComponent.openImageIndexes().has(1)).toBe(true);
    expect(imageModalsComponent.openImageIndexes().has(0)).toBe(false);
  });

  it('downloads the image when it is opened and stores the object URL', async () => {
    imageViewerService.open({ imageUrl: firstImageUrl });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(downloadKoboImage).toHaveBeenCalledWith({
      programId: 1,
      referenceId,
      attributeName: 'upload_an_image',
    });
    expect(createObjectUrl).toHaveBeenCalledWith(downloadedBlob);
    expect(imageModalsComponent.downloadedImageObjectUrls()[0]).toBe(
      'blob:https://example.org/kobo-image',
    );
  });

  it('does not re-download when the image was already downloaded', async () => {
    imageViewerService.open({ imageUrl: firstImageUrl });
    fixture.detectChanges();
    await fixture.whenStable();

    imageViewerService.close({ imageUrl: firstImageUrl });
    fixture.detectChanges();

    imageViewerService.open({ imageUrl: firstImageUrl });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(downloadKoboImage).toHaveBeenCalledTimes(1);
  });

  it('closes the dialog via the shared service', () => {
    imageViewerService.open({ imageUrl: firstImageUrl });
    fixture.detectChanges();

    expect(imageModalsComponent.openImageIndexes().has(0)).toBe(true);

    imageModalsComponent.closeDialog({ imageIndex: 0 });
    fixture.detectChanges();

    expect(imageModalsComponent.openImageIndexes().has(0)).toBe(false);
    expect(imageViewerService.isOpen({ imageUrl: firstImageUrl })).toBe(false);
  });
});
