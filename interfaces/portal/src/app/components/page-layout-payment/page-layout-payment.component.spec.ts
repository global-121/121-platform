import { LOCALE_ID, NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  provideTanStackQuery,
  QueryClient,
  queryOptions,
} from '@tanstack/angular-query-experimental';
import { MessageService } from 'primeng/api';

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
      mockQueryFactory({ hasBeenStarted: false }),
    );
    mockProgramApiService.getProgram.and.returnValue(mockQueryFactory(null));
    mockPaymentApiService.getPaymentAggregationsSummaries.and.returnValue(
      mockQueryFactory([]),
    );
    mockPaymentApiService.getPaymentStatus.and.returnValue(
      mockQueryFactory({}),
    );
    mockPaymentApiService.getPaymentTransactions.and.returnValue(
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
    mockAuthService.hasAllPermissions.and.returnValue(false);
    const fixture = createFixture();

    // Act
    const result = fixture.componentInstance.canDeletePayment();

    // Assert
    expect(result).toBe(false);
  });

  it('should return false when payment is in progress', () => {
    // Arrange
    mockPaymentApiService.getPaymentStatus.and.returnValue(
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
    mockPaymentApiService.getPaymentAggregationFull.and.returnValue(
      mockQueryFactory({ hasBeenStarted: true }),
    );
    const fixture = createFixture();

    // Act
    const result = fixture.componentInstance.canDeletePayment();

    // Assert
    expect(result).toBe(false);
  });
});
