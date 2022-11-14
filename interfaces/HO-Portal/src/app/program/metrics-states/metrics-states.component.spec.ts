import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import apiProgramMetricsMock from 'src/app/mocks/api.program-metrics.mock';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramMetrics } from 'src/app/models/program-metrics.model';
import { Program } from 'src/app/models/program.model';
import { PastPaymentsService } from 'src/app/services/past-payments.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { MetricsStatesComponent } from './metrics-states.component';

@Component({
  template: `<app-metrics-states [program]="program"></app-metrics-states>`,
})
class TestHostComponent {
  program: Program | any;
}

describe('MetricsStatesComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let testHost: TestHostComponent;

  const mockPastPayments = [
    {
      id: 1,
      paymentDate: new Date('2021-01-05'),
      amount: 1,
    },
    {
      id: 2,
      paymentDate: new Date('2021-02-05'),
      amount: 1,
    },
  ];

  const mockPastPaymentsWithDates = mockPastPayments.map((payment) => {
    return {
      id: payment.id,
      date: payment.paymentDate,
    };
  });

  const fixtureProgram = apiProgramsMock.programs[0];
  const mockProgramMetrics: ProgramMetrics = apiProgramMetricsMock;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MetricsStatesComponent, TestHostComponent],
      imports: [TranslateModule.forRoot(), FormsModule, SharedModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideMagicalMock(ProgramsServiceApiService),
        provideMagicalMock(PastPaymentsService),
      ],
    }).compileComponents();
  }));

  let mockProgramsApi: jasmine.SpyObj<any>;
  let mockPastPaymentsService: jasmine.SpyObj<any>;

  beforeEach(() => {
    mockProgramsApi = TestBed.inject(ProgramsServiceApiService);
    mockProgramsApi.getMetricsById.and.returnValue(
      new Promise((r) => r(mockProgramMetrics)),
    );
    mockProgramsApi.getMetricsByIdWithCondition.and.returnValue(
      new Promise((r) => r(mockProgramMetrics)),
    );
    mockProgramsApi.getPastPayments.and.returnValue(
      new Promise((r) => r(mockPastPayments)),
    );

    mockPastPaymentsService = TestBed.inject(PastPaymentsService);
    mockPastPaymentsService.getPaymentsWithDates.and.returnValue(
      new Promise((r) => r(mockPastPaymentsWithDates)),
    );
    mockPastPaymentsService.getPaymentYearMonths.and.returnValue(
      new Promise((r) => r(mockPastPaymentsWithDates)),
    );

    fixture = TestBed.createComponent(TestHostComponent);
    testHost = fixture.componentInstance;

    testHost.program = fixtureProgram;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(testHost).toBeTruthy();
  });

  it('should request the "to-date" metrics for the provided program', async () => {
    // Arrange
    testHost.program = fixtureProgram;

    // Act
    fixture.autoDetectChanges();
    await fixture.whenStable();

    // Assert
    expect(mockProgramsApi.getMetricsById).toHaveBeenCalledWith(
      fixtureProgram.id,
    );
  });

  it('should request the "past-payments" data for the provided program', async () => {
    // Arrange
    testHost.program = fixtureProgram;

    // Act
    fixture.autoDetectChanges();
    await fixture.whenStable();

    // Assert
    expect(mockPastPaymentsService.getPaymentsWithDates).toHaveBeenCalledWith(
      fixtureProgram.id,
    );
    expect(mockPastPaymentsService.getPaymentYearMonths).toHaveBeenCalledWith(
      fixtureProgram.id,
    );
  });

  it('should request the specific metrics for the most-recent payment', async () => {
    // Arrange
    testHost.program = fixtureProgram;
    const mockLastPaymentId = mockPastPayments[0].id;

    // Act
    fixture.autoDetectChanges();
    await fixture.whenStable();

    // Assert
    expect(mockProgramsApi.getMetricsByIdWithCondition).toHaveBeenCalledWith(
      fixtureProgram.id,
      `payment=${mockLastPaymentId}`,
    );
  });

  it('should request the specific metrics for the most-recent month', async () => {
    // Arrange
    testHost.program = fixtureProgram;
    const mockLastPaymentDate = new Date(mockPastPayments[0].paymentDate);

    // Act
    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(mockProgramsApi.getMetricsByIdWithCondition).toHaveBeenCalledWith(
      fixtureProgram.id,
      `year=${mockLastPaymentDate.getFullYear()}&month=${mockLastPaymentDate.getMonth()}`,
    );
  });

  it('should request the metrics (again) when triggered from the interface', async () => {
    // Arrange
    testHost.program = fixtureProgram;

    // Act
    fixture.autoDetectChanges();
    await fixture.whenStable();

    // Assert
    expect(mockProgramsApi.getMetricsById).toHaveBeenCalledTimes(1);
    expect(mockProgramsApi.getMetricsByIdWithCondition).toHaveBeenCalledTimes(
      4,
    );
    document.getElementById('refresh').click();

    expect(mockProgramsApi.getMetricsById).toHaveBeenCalledTimes(2);
    expect(mockProgramsApi.getMetricsByIdWithCondition).toHaveBeenCalledTimes(
      4,
    );
  });
});
