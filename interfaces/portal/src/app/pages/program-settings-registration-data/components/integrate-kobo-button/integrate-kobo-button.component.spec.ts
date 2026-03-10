import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { MessageService } from 'primeng/api';

import { KoboApiService } from '~/domains/kobo/kobo-api.service';
import { IntegrateKoboButtonComponent } from '~/pages/program-settings-registration-data/components/integrate-kobo-button/integrate-kobo-button.component';
import { ToastService } from '~/services/toast.service';

describe('IntegrateKoboButtonComponent', () => {
  let component: IntegrateKoboButtonComponent;
  let fixture: ComponentFixture<IntegrateKoboButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegrateKoboButtonComponent],
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IntegrateKoboButtonComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('extractServerAndAssetIdFromUrl', () => {
    it('should extract serverUrl and assetId from valid Kobo form URLs', () => {
      // Arrange
      const cases = [
        {
          input: 'https://kobo.example.org/#/forms/asset-id-123/summary',
          expected: {
            serverUrl: 'https://kobo.example.org/',
            assetId: 'asset-id-123',
          },
        },
        {
          input: 'https://kobo.example.org/#/forms/asset-id-123  ',
          expected: {
            serverUrl: 'https://kobo.example.org/',
            assetId: 'asset-id-123',
          },
        },
        {
          input: 'https://example.net/kobo/#/forms/asset-id-123/summary',
          expected: {
            serverUrl: 'https://example.net/kobo/',
            assetId: 'asset-id-123',
          },
        },
        {
          input:
            'https://kobo.example.org/?param=value#/forms/asset-id-123/summary  ',
          expected: {
            serverUrl: 'https://kobo.example.org/',
            assetId: 'asset-id-123',
          },
        },
        {
          input: 'http://localhost:8008/#/forms/asset-id-123/summary  ',
          expected: {
            serverUrl: 'http://localhost:8008/',
            assetId: 'asset-id-123',
          },
        },
      ];

      cases.forEach(({ input, expected }) => {
        // Act
        const result = component.extractServerAndAssetIdFromUrl(input);

        // Assert
        expect(result.serverUrl).toBe(expected.serverUrl);
        expect(result.assetId).toBe(expected.assetId);
      });
    });

    it('should return empty object for malformed URL', () => {
      // Arrange
      const cases = [
        '',
        'not-a-valid-url',
        'kobo.example.org/#/forms/asset-id-123/summary',
        'https://kobo.example.org/#/views/asset-id-123/summary',
        'https://kobo.example.org/#/forms//details',
        'https://kobo.example.org/forms/asset-id-123/summary',
        'https://kobo.example.org/#/forms/',
      ];

      cases.forEach((caseInput) => {
        // Act
        const result = component.extractServerAndAssetIdFromUrl(caseInput);

        // Assert
        expect(result).toEqual({});
      });
    });
  });

  describe('onFormUrlUpdate', () => {
    it('should update Kobo integration when a valid URL is provided', () => {
      // Arrange
      const testInput = 'https://kobo.example.org/#/forms/asset-id-123/summary';
      spyOn(component, 'extractServerAndAssetIdFromUrl').and.returnValue({
        serverUrl: 'https://kobo.example.org/',
        assetId: 'asset-id-123',
      });

      // Act
      component.onFormUrlUpdate({
        target: { value: testInput },
      } as unknown as InputEvent);

      // Assert
      expect(component.extractServerAndAssetIdFromUrl).toHaveBeenCalledWith(
        testInput,
      );
      expect(
        component.koboConfigurationFormGroup.get('serverUrl')?.valid,
      ).toBeTrue();
      expect(component.koboConfigurationFormGroup.get('serverUrl')?.value).toBe(
        'https://kobo.example.org/',
      );
      expect(
        component.koboConfigurationFormGroup.get('assetId')?.valid,
      ).toBeTrue();
      expect(component.koboConfigurationFormGroup.get('assetId')?.value).toBe(
        'asset-id-123',
      );
    });

    it('should NOT update Kobo integration when an invalid URL is provided', () => {
      // Arrange
      const testInput = 'not-a-valid-url';
      spyOn(component, 'extractServerAndAssetIdFromUrl').and.returnValue({});

      // Act
      component.onFormUrlUpdate({
        target: { value: testInput },
      } as unknown as InputEvent);

      // Assert
      expect(component.extractServerAndAssetIdFromUrl).toHaveBeenCalledWith(
        testInput,
      );
      expect(component.koboConfigurationFormGroup.valid).toBeFalse();
    });
  });
});
