import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  provideTanStackQuery,
  QueryClient,
  queryOptions,
} from '@tanstack/angular-query-experimental';

import { PageLayoutPaymentComponent } from '~/components/page-layout-payment/page-layout-payment.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { PaymentAggregationFull } from '~/domains/payment/payment.model';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { FindAllTransactionsResult } from '~/domains/transaction/transaction.model';
import { AuthService } from '~/services/auth.service';

const createMockAggregateData = (
  partial: Partial<PaymentAggregationFull> = {},
): PaymentAggregationFull => ({
  paymentId: 1,
  success: { count: 0, transferValue: 0 },
  waiting: { count: 0, transferValue: 0 },
  failed: { count: 0, transferValue: 0 },
  pendingApproval: { count: 0, transferValue: 0 },
  approved: { count: 0, transferValue: 0 },
  isPaymentApproved: false,
  approvalsRequired: 1,
  approvalsGiven: 0,
  paymentDate: '2024-01-01T00:00:00.000Z',
  fsps: [],
  approvalStatus: [],
  ...partial,
});

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
  let mockAuthService: { hasAllPermissions: jasmine.Spy; user: null };

  let mockPaymentApiService: Record<string, jasmine.Spy>;

  let mockProgramApiService: Record<string, jasmine.Spy>;

  beforeEach(async () => {
    mockAuthService = {
      hasAllPermissions: jasmine.createSpy('hasAllPermissions'),
      user: null,
    };
    mockPaymentApiService = jasmine.createSpyObj('PaymentApiService', [
      'getPaymentAggregationFull',
      'getPaymentAggregationsSummaries',
      'getPaymentStatus',
      'getPaymentTransactions',
    ]) as Record<string, jasmine.Spy>;
    mockProgramApiService = jasmine.createSpyObj('ProgramApiService', [
      'getProgram',
    ]) as Record<string, jasmine.Spy>;

    mockAuthService.hasAllPermissions.and.returnValue(true);
    mockPaymentApiService.getPaymentAggregationFull.and.returnValue(
      mockQueryFactory(createMockAggregateData()),
    );
    mockProgramApiService.getProgram.and.returnValue(mockQueryFactory(null));
    mockPaymentApiService.getPaymentAggregationsSummaries.and.returnValue(
      mockQueryFactory([]),
    );
    mockPaymentApiService.getPaymentStatus.and.returnValue(
      mockQueryFactory({ inProgress: false }),
    );
    mockPaymentApiService.getPaymentTransactions.and.returnValue(
      mockQueryFactory({
        data: [] as FindAllTransactionsResult['data'],
        meta: { totalItems: 0 },
      } as FindAllTransactionsResult),
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
      ],
    })
      .overrideComponent(PageLayoutPaymentComponent, {
        set: { imports: [], template: '<div></div>' },
      })
      .compileComponents();
  });

  const createFixture = () => {
    const fixture = TestBed.createComponent(PageLayoutPaymentComponent);
    fixture.componentRef.setInput('programId', '1');
    fixture.componentRef.setInput('paymentId', '1');
    fixture.detectChanges();
    return fixture;
  };

  it('should return true when user has permission and no transactions are processed', () => {
    // Arrange
    const fixture = createFixture();

    // Act
    const result = fixture.componentInstance.canDeletePayment();

    // Assert
    expect(result).toBe(true);
  });

  it('should return false when user lacks PaymentCREATE permission', () => {
    // Arrange
    mockAuthService.hasAllPermissions.and.returnValue(false);
    const fixture = createFixture();

    // Act
    const result = fixture.componentInstance.canDeletePayment();

    // Assert
    expect(result).toBe(false);
  });

  it('should return false when there are processed transactions', () => {
    // Arrange
    mockPaymentApiService.getPaymentAggregationFull.and.returnValue(
      mockQueryFactory(
        createMockAggregateData({ success: { count: 3, transferValue: 75 } }),
      ),
    );
    const fixture = createFixture();

    // Act
    const result = fixture.componentInstance.canDeletePayment();

    // Assert
    expect(result).toBe(false);
  });
});
