import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { InstallmentData } from 'src/app/models/installment.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ActionType } from '../../models/action-type.model';
import { MakePaymentComponent } from './make-payment.component';

describe('MakePaymentComponent', () => {
  let component: MakePaymentComponent;
  let fixture: ComponentFixture<MakePaymentComponent>;

  const mockProgramId = 1;
  const mockInstallmentData: InstallmentData = {
    id: 0,
    installmentDate: new Date(),
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
    timestamp: new Date(),
  };
  const mockLatestFinishAction = {
    id: 2,
    actionType: ActionType.paymentFinished,
    timestamp: new Date(),
  };

  let mockProgramsApi: jasmine.SpyObj<ProgramsServiceApiService>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MakePaymentComponent],
      imports: [TranslateModule.forRoot(), FormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideMagicalMock(ProgramsServiceApiService)],
    }).compileComponents();
  }));

  beforeEach(() => {
    mockProgramsApi = TestBed.get(ProgramsServiceApiService);

    mockProgramsApi.getTotalIncluded.and.returnValue(
      new Promise((r) => r({ connections: 2, transferAmounts: 2 })),
    );
    mockProgramsApi.getPastInstallments.and.returnValue(
      new Promise((r) => r(mockPastInstallments)),
    );
    mockProgramsApi.getLastInstallmentId.and.returnValue(
      new Promise((r) => r(mockLastInstallmentId)),
    );
    mockProgramsApi.retrieveLatestActions.and.returnValues(
      new Promise((r) => r(mockLatestStartAction)),
      new Promise((r) => r(mockLatestFinishAction)),
    );

    fixture = TestBed.createComponent(MakePaymentComponent);
    component = fixture.componentInstance;

    component.program = apiProgramsMock.programs[mockProgramId];
    component.program.distributionDuration = mockPastInstallments.length + 1;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  xit('should be disabled when 0 PA are included', async () => {
    mockProgramsApi.getTotalIncluded.and.returnValue(
      new Promise((r) => r({ connections: 0, transferAmounts: 0 })),
    );

    await fixture.detectChanges();

    await expect(mockProgramsApi.getTotalIncluded).toHaveBeenCalledTimes(1);
    expect(component.isEnabled).toBeFalse();
  });

  xit('should be enabled when 1(+) PA are included', async () => {
    mockProgramsApi.getTotalIncluded.and.returnValue(
      new Promise((r) => r({ connections: 1, transferAmounts: 1 })),
    );

    await fixture.detectChanges();

    await expect(mockProgramsApi.getTotalIncluded).toHaveBeenCalledTimes(1);
    expect(component.isEnabled).toBeTrue();
  });

  xit('should be disabled when all installments are done', async () => {
    component.program.distributionDuration = mockPastInstallments.length;

    await fixture.detectChanges();

    await expect(mockProgramsApi.getLastInstallmentId).toHaveBeenCalledTimes(1);
    expect(component.isEnabled).toBeFalse();
  });

  xit('should be disabled when a payment is already in progress', async () => {
    mockProgramsApi.retrieveLatestActions.and.returnValues(
      new Promise((r) => r(mockLatestStartAction)),
      new Promise((r) => r(null)),
    );

    await fixture.detectChanges();

    await expect(mockProgramsApi.retrieveLatestActions).toHaveBeenCalledTimes(
      1,
    );
    expect(component.isEnabled).toBeFalse();
  });

  xit('should be enabled when a previous payment is finished', async () => {
    await fixture.detectChanges();

    await expect(mockProgramsApi.retrieveLatestActions).toHaveBeenCalledTimes(
      2,
    );
    expect(component.isEnabled).toBeTrue();
  });

  xit('should be enabled when no previous payment is done', async () => {
    mockProgramsApi.retrieveLatestActions.and.returnValues(
      new Promise((r) => r(null)),
      new Promise((r) => r(null)),
    );
    await fixture.detectChanges();

    await expect(mockProgramsApi.retrieveLatestActions).toHaveBeenCalledTimes(
      2,
    );
    expect(component.isEnabled).toBeTrue();
  });
});
