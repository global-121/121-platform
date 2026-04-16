import { LOCALE_ID, NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  provideTanStackQuery,
  QueryClient,
  queryOptions,
} from '@tanstack/angular-query-experimental';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { PaymentSummaryCardComponent } from '~/pages/program-payments/components/payment-summary-card/payment-summary-card.component';

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

describe('PaymentSummaryCardComponent - paymentTitle', () => {
  let mockPaymentApiService: Record<string, Mock>;
  let mockProgramApiService: Record<string, Mock>;

  beforeEach(async () => {
    mockPaymentApiService = {
      getPaymentAggregationFull: vi
        .fn()
        .mockName('PaymentApiService.getPaymentAggregationFull'),
      getPaymentStatus: vi.fn().mockName('PaymentApiService.getPaymentStatus'),
    } as Record<string, Mock>;

    mockProgramApiService = {
      getProgram: vi.fn().mockName('ProgramApiService.getProgram'),
    } as Record<string, Mock>;

    mockPaymentApiService.getPaymentAggregationFull.mockReturnValue(
      mockQueryFactory(undefined),
    );
    mockPaymentApiService.getPaymentStatus.mockReturnValue(
      mockQueryFactory({ inProgress: false }),
    );
    mockProgramApiService.getProgram.mockReturnValue(mockQueryFactory(null));

    await TestBed.configureTestingModule({
      imports: [PaymentSummaryCardComponent],
      providers: [
        provideTanStackQuery(new QueryClient()),
        { provide: PaymentApiService, useValue: mockPaymentApiService },
        { provide: ProgramApiService, useValue: mockProgramApiService },
        { provide: LOCALE_ID, useValue: 'en' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  const basePaymentData = {
    paymentId: 1,
    name: 'Payment Name',
    paymentDate: '2026-01-01T10:00:00.000Z',
    isPaymentApproved: false,
    approvalsRequired: 1,
    approvalsGiven: 0,
    aggregationsPerStatus: {
      waiting: { count: 0, transferValue: 0 },
      success: { count: 0, transferValue: 0 },
      failed: { count: 0, transferValue: 0 },
      pending: { count: 0, transferValue: 0 },
      approved: { count: 0, transferValue: 0 },
      pendingApproval: { count: 0, transferValue: 0 },
    },
  };

  const createFixture = (overrides?: Partial<typeof basePaymentData>) => {
    const fixture = TestBed.createComponent(PaymentSummaryCardComponent);
    fixture.componentRef.setInput('programId', '1');
    fixture.componentRef.setInput('paymentId', 1);
    fixture.componentRef.setInput('paymentDate', '2026-01-01T10:00:00.000Z');
    fixture.componentRef.setInput('cardIndex', 1);
    fixture.componentRef.setInput('paymentData', {
      ...basePaymentData,
      ...overrides,
    });
    return fixture;
  };

  it('should return payment name when available', () => {
    // Arrange
    const fixture = createFixture({ name: 'Custom Name' });

    // Act
    const result = fixture.componentInstance.paymentTitle();

    // Assert
    expect(result).toBe('Custom Name');
  });

  it('should return fallback title when payment name is empty', () => {
    // Arrange
    const fixture = createFixture({ name: '' });

    // Act
    const result = fixture.componentInstance.paymentTitle();

    // Assert
    expect(result).toContain('Payment');
    expect(result).not.toBe('Payment');
  });
});
