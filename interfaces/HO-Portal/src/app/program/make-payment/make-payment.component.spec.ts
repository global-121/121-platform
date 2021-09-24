import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { InstallmentData } from 'src/app/models/installment.model';
import { PastPaymentsService } from 'src/app/services/past-payments.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ActionType } from '../../models/actions.model';
import { MakePaymentComponent } from './make-payment.component';

describe('MakePaymentComponent', () => {
  let component: MakePaymentComponent;
  let fixture: ComponentFixture<MakePaymentComponent>;

  const mockProgramId = 1;
  const mockInstallmentData: InstallmentData = {
    id: 0,
    installmentDate: new Date(),
    amount: 1,
  };
  const mockPastInstallments = [
    {
      ...mockInstallmentData,
      id: 1,
    },
    {
      ...mockInstallmentData,
      id: 2,
    },
  ];
  const mockLastInstallmentId = 2;

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

  let mockProgramsApi: jasmine.SpyObj<ProgramsServiceApiService>;
  let mockPastPaymentsService: jasmine.SpyObj<PastPaymentsService>;

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
    mockProgramsApi = TestBed.get(ProgramsServiceApiService);

    mockProgramsApi.getTotalIncluded.and.returnValue(
      new Promise((r) => r({ registrations: 2, transferAmounts: 2 })),
    );
    mockProgramsApi.getPastInstallments.and.returnValue(
      new Promise((r) => r(mockPastInstallments)),
    );
    mockProgramsApi.retrieveLatestActions.and.returnValues(
      new Promise((r) => r(mockLatestStartAction)),
      new Promise((r) => r(mockLatestFinishAction)),
    );

    mockPastPaymentsService = TestBed.get(PastPaymentsService);
    mockPastPaymentsService.getLastInstallmentId.and.returnValue(
      new Promise((r) => r(mockLastInstallmentId)),
    );

    fixture = TestBed.createComponent(MakePaymentComponent);
    component = fixture.componentInstance;

    component.program = apiProgramsMock.programs[mockProgramId];
    component.program.distributionDuration = mockPastInstallments.length + 1;
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

  it('should be disabled when all installments are done', async () => {
    component.program.distributionDuration = mockPastInstallments.length;

    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(mockPastPaymentsService.getLastInstallmentId).toHaveBeenCalledTimes(
      1,
    );
    expect(component.isEnabled).toBeFalse();
  });

  it('should be disabled when a payment is already in progress', async () => {
    mockProgramsApi.retrieveLatestActions.and.returnValues(
      new Promise((r) => r(mockLatestStartAction)),
      new Promise((r) => r(null)),
    );

    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(mockProgramsApi.retrieveLatestActions).toHaveBeenCalledTimes(2);
    expect(component.isEnabled).toBeFalse();
  });

  it('should be enabled when a previous payment is finished', async () => {
    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(mockProgramsApi.retrieveLatestActions).toHaveBeenCalledTimes(2);
    expect(component.isEnabled).toBeTrue();
  });

  it('should be enabled when no previous payment is done', async () => {
    mockProgramsApi.retrieveLatestActions.and.returnValues(
      new Promise((r) => r(null)),
    );

    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(mockProgramsApi.retrieveLatestActions).toHaveBeenCalledTimes(1);
    expect(component.isEnabled).toBeTrue();
  });
});
