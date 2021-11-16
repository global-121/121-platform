import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { PaymentData } from 'src/app/models/payment.model';
import { PastPaymentsService } from 'src/app/services/past-payments.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ActionType } from '../../models/actions.model';
import { FspIntegrationType } from '../../models/fsp.model';
import { MakePaymentComponent } from './make-payment.component';

describe('MakePaymentComponent', () => {
  let component: MakePaymentComponent;
  let fixture: ComponentFixture<MakePaymentComponent>;

  const mockProgramId = 1;
  const mockPaymentData: PaymentData = {
    id: 0,
    paymentDate: new Date(),
    amount: 1,
  };
  const mockPastPayments = [
    {
      ...mockPaymentData,
      id: 1,
    },
    {
      ...mockPaymentData,
      id: 2,
    },
  ];
  const mockLastPaymentId = 2;
  const mockfspIntegrationType = FspIntegrationType.api;

  const mockLatestStartAction = {
    id: 1,
    actionType: ActionType.paymentStarted,
    created: new Date(),
  };
  const mockLatestFinishAction = {
    id: 2,
    actionType: ActionType.paymentFinished,
    created: new Date(),
  };

  let mockProgramsApi: jasmine.SpyObj<any>;
  let mockPastPaymentsService: jasmine.SpyObj<any>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MakePaymentComponent],
      imports: [TranslateModule.forRoot(), FormsModule, RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideMagicalMock(ProgramsServiceApiService),
        provideMagicalMock(PastPaymentsService),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    mockProgramsApi = TestBed.inject(ProgramsServiceApiService);

    mockProgramsApi.getTotalIncluded.and.returnValue(
      new Promise((r) => r({ registrations: 2, transferAmounts: 2 })),
    );
    mockProgramsApi.getPastPayments.and.returnValue(
      new Promise((r) => r(mockPastPayments)),
    );
    mockProgramsApi.retrieveLatestActions.and.returnValues(
      new Promise((r) => r(mockLatestStartAction)),
      new Promise((r) => r(mockLatestFinishAction)),
    );

    mockPastPaymentsService = TestBed.inject(PastPaymentsService);
    mockPastPaymentsService.getLastPaymentId.and.returnValue(
      new Promise((r) => r(mockLastPaymentId)),
    );

    fixture = TestBed.createComponent(MakePaymentComponent);
    component = fixture.componentInstance;

    component.program = apiProgramsMock.programs[mockProgramId];
    component.program.distributionDuration = mockPastPayments.length + 1;
    component.program.financialServiceProviders = [
      { integrationType: mockfspIntegrationType },
    ];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be disabled when 0 PA are included', async () => {
    mockProgramsApi.getTotalIncluded.and.returnValue(
      new Promise((r) => r({ registrations: 0, transferAmounts: 0 })),
    );

    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(mockProgramsApi.getTotalIncluded).toHaveBeenCalledTimes(1);
    expect(component.isEnabled).toBeFalse();
  });

  it('should be enabled when 1(+) PA are included', async () => {
    mockProgramsApi.getTotalIncluded.and.returnValue(
      new Promise((r) => r({ registrations: 1, transferAmounts: 1 })),
    );

    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(mockProgramsApi.getTotalIncluded).toHaveBeenCalledTimes(1);
    expect(component.isEnabled).toBeTrue();
  });

  it('should be disabled when all payments are done', async () => {
    component.program.distributionDuration = mockPastPayments.length;

    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(mockPastPaymentsService.getLastPaymentId).toHaveBeenCalledTimes(1);
    expect(component.isEnabled).toBeFalse();
  });

  xit('should be disabled when a payment is already in progress', async () => {
    mockProgramsApi.retrieveLatestActions.and.returnValues(
      new Promise((r) => r(mockLatestStartAction)),
      new Promise((r) => r(null)),
    );

    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(component.isEnabled).toBeFalse();
  });

  it('should be enabled when a previous payment is finished', async () => {
    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(component.isEnabled).toBeTrue();
  });

  it('should be enabled when no previous payment is done', async () => {
    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(component.isEnabled).toBeTrue();
  });
});
