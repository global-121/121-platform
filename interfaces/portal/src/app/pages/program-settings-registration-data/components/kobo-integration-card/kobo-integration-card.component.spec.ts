import type { Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  provideTanStackQuery,
  QueryClient,
  queryOptions,
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
            getKoboIntegration: (programId: Signal<number | string>) => () =>
              queryOptions({
                queryKey: ['koboIntegration', programId()],
                queryFn: () => Promise.resolve(null),
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
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KoboIntegrationCardComponent);
    fixture.componentRef.setInput('programId', 1);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
