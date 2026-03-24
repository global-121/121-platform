import { LOCALE_ID, NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  provideTanStackQuery,
  QueryClient,
  queryOptions,
} from '@tanstack/angular-query-experimental';
import { MessageService } from 'primeng/api';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PageLayoutPaymentComponent } from '~/components/page-layout-payment/page-layout-payment.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { AuthService } from '~/services/auth.service';

// Returns a query factory (matching the shape returned by generateQueryOptions)
// that immediately resolves with the provided data (success state via initialData).
const mockQueryFactory =
  <T>(initialData: T) =>
  () =>
    queryOptions({
      queryKey: ['mock', initialData],
      queryFn: (): Promise<T> => {
        throw new Error('mock query - should never be called');
      },
      initialData,
    });

describe('PageLayoutPaymentComponent - canDeletePayment', () => {
  let mockAuthService: {
    hasAllPermissions: Mock;
    user: null;
  };

  let mockPaymentApiService: Record<string, Mock>;

  let mockProgramApiService: Record<string, Mock>;

  beforeEach(async () => {
    mockAuthService = {
      hasAllPermissions: vi.fn(),
      user: null,
    };
    mockPaymentApiService = {
      getPaymentAggregationFull: vi
        .fn()
        .mockName('PaymentApiService.getPaymentAggregationFull'),
      getPaymentAggregationsSummaries: vi
        .fn()
        .mockName('PaymentApiService.getPaymentAggregationsSummaries'),
      getPaymentStatus: vi.fn().mockName('PaymentApiService.getPaymentStatus'),
      getPaymentTransactions: vi
        .fn()
        .mockName('PaymentApiService.getPaymentTransactions'),
    } as Record<string, Mock>;
    mockProgramApiService = {
      getProgram: vi.fn().mockName('ProgramApiService.getProgram'),
    } as Record<string, Mock>;

    mockAuthService.hasAllPermissions.mockReturnValue(true);
    mockPaymentApiService.getPaymentAggregationFull.mockReturnValue(
      mockQueryFactory({ hasBeenStarted: false }),
    );
    mockProgramApiService.getProgram.mockReturnValue(mockQueryFactory(null));
    mockPaymentApiService.getPaymentAggregationsSummaries.mockReturnValue(
      mockQueryFactory([]),
    );
    mockPaymentApiService.getPaymentStatus.mockReturnValue(
      mockQueryFactory({}),
    );
    mockPaymentApiService.getPaymentTransactions.mockReturnValue(
      mockQueryFactory({ data: [], meta: { totalItems: 0 } }),
    );

    await TestBed.configureTestingModule({
      imports: [PageLayoutPaymentComponent],
      providers: [
        provideTanStackQuery(new QueryClient()),
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },

        { provide: PaymentApiService, useValue: mockPaymentApiService },

        { provide: ProgramApiService, useValue: mockProgramApiService },
        { provide: LOCALE_ID, useValue: 'en' },
        MessageService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  const createFixture = () => {
    const fixture = TestBed.createComponent(PageLayoutPaymentComponent);
    fixture.componentRef.setInput('programId', '1');
    fixture.componentRef.setInput('paymentId', '1');
    return fixture;
  };

  it('should return true when user has permission and payment has not started', () => {
    // Arrange
    const fixture = createFixture();

    // Act
    const result = fixture.componentInstance.canDeletePayment();

    // Assert
    expect(result).toBe(true);
  });

  it('should return false when user lacks PaymentCREATE permission', () => {
    // Arrange
    mockAuthService.hasAllPermissions.mockReturnValue(false);
    const fixture = createFixture();

    // Act
    const result = fixture.componentInstance.canDeletePayment();

    // Assert
    expect(result).toBe(false);
  });

  it('should return false when payment is in progress', () => {
    // Arrange
    mockPaymentApiService.getPaymentStatus.mockReturnValue(
      mockQueryFactory({ inProgress: true }),
    );
    const fixture = createFixture();

    // Act
    const result = fixture.componentInstance.canDeletePayment();

    // Assert
    expect(result).toBe(false);
  });

  it('should return false when payment has already started', () => {
    // Arrange
    mockPaymentApiService.getPaymentAggregationFull.mockReturnValue(
      mockQueryFactory({ hasBeenStarted: true }),
    );
    const fixture = createFixture();

    // Act
    const result = fixture.componentInstance.canDeletePayment();

    // Assert
    expect(result).toBe(false);
  });
});
