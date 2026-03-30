import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { MessageService } from 'primeng/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KoboApiService } from '~/domains/kobo/kobo-api.service';
import { KoboIntegrationCardComponent } from '~/pages/program-settings-registration-data/components/kobo-integration-card/kobo-integration-card.component';
import { ToastService } from '~/services/toast.service';
import { TrackingService } from '~/services/tracking.service';

class TrackingServiceStub {
  trackEvent = vi.fn();
}

describe('KoboIntegrationCardComponent', () => {
  let component: KoboIntegrationCardComponent;
  let fixture: ComponentFixture<KoboIntegrationCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KoboIntegrationCardComponent],
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

    fixture = TestBed.createComponent(KoboIntegrationCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
