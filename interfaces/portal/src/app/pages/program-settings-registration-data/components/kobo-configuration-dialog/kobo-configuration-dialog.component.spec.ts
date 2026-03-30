import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { MessageService } from 'primeng/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { extractServerAndAssetIdFromUrl } from '~/domains/kobo/kobo.helpers';
import { KoboApiService } from '~/domains/kobo/kobo-api.service';
import { KoboConfigurationDialogComponent } from '~/pages/program-settings-registration-data/components/kobo-configuration-dialog/kobo-configuration-dialog.component';
import { ToastService } from '~/services/toast.service';
import { TrackingService } from '~/services/tracking.service';

class TrackingServiceStub {
  trackEvent = vi.fn();
}

describe('KoboConfigurationDialogComponent', () => {
  let component: KoboConfigurationDialogComponent;
  let fixture: ComponentFixture<KoboConfigurationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KoboConfigurationDialogComponent],
      providers: [
        {
          provide: KoboApiService,
          useValue: {
            getKoboIntegration: () => () => ({
              data: () => null,
              isLoading: false,
              error: null,
            }),
          },
        },
        ToastService,
        MessageService,
        provideTanStackQuery(
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
            },
          }),
        ),
        { provide: TrackingService, useClass: TrackingServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KoboConfigurationDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onFormUrlUpdate', () => {
    it('should update Kobo integration when a valid URL is provided', () => {
      // Arrange
      const testInput = 'https://kobo.example.org/#/forms/asset-id-123/summary';

      // Act
      component.onFormUrlUpdate({
        target: { value: testInput },
      } as unknown as InputEvent);

      // Assert
      const expected = extractServerAndAssetIdFromUrl(testInput);
      expect(component.koboConfigurationFormGroup.get('serverUrl')?.valid).toBe(
        true,
      );
      expect(component.koboConfigurationFormGroup.get('serverUrl')?.value).toBe(
        expected.serverUrl,
      );
      expect(component.koboConfigurationFormGroup.get('assetId')?.valid).toBe(
        true,
      );
      expect(component.koboConfigurationFormGroup.get('assetId')?.value).toBe(
        expected.assetId,
      );
    });

    it('should NOT update Kobo integration when an invalid URL is provided', () => {
      // Arrange
      const testInput = 'not-a-valid-url';

      // Act
      component.onFormUrlUpdate({
        target: { value: testInput },
      } as unknown as InputEvent);

      // Assert
      expect(component.koboConfigurationFormGroup.valid).toBe(false);
    });
  });
});
