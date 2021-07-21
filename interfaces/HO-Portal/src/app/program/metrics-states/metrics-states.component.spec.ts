import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { getRandomInt, provideMagicalMock } from 'src/app/mocks/helpers';
import { PaStatus } from 'src/app/models/person.model';
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

  const mockPastInstallments = [
    {
      id: 1,
      installmentDate: new Date('2021-01-05'),
      amount: 1,
    },
    {
      id: 2,
      installmentDate: new Date('2021-02-05'),
      amount: 1,
    },
  ];

  const mockPastInstallmentsWithDates = mockPastInstallments.map(
    (installment) => {
      return {
        id: installment.id,
        date: installment.installmentDate,
      };
    },
  );

  const fixtureProgram = apiProgramsMock.programs[0];
  const mockProgramMetrics: ProgramMetrics = {
    updated: new Date().toISOString(),
    pa: {
      [PaStatus.imported]: getRandomInt(0, 100),
      [PaStatus.invited]: getRandomInt(0, 100),
      [PaStatus.noLongerEligible]: getRandomInt(0, 100),
      [PaStatus.created]: getRandomInt(0, 100),
      [PaStatus.registered]: getRandomInt(0, 100),
      [PaStatus.selectedForValidation]: getRandomInt(0, 100),
      [PaStatus.validated]: getRandomInt(0, 100),
      [PaStatus.included]: getRandomInt(0, 100),
      [PaStatus.inclusionEnded]: getRandomInt(0, 100),
      [PaStatus.rejected]: getRandomInt(0, 100),
    },
  };

  beforeEach(async(() => {
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

  let mockProgramsApi: jasmine.SpyObj<ProgramsServiceApiService>;
  let mockPastPaymentsService: jasmine.SpyObj<PastPaymentsService>;

  beforeEach(() => {
    mockProgramsApi = TestBed.get(ProgramsServiceApiService);
    mockProgramsApi.getMetricsById.and.returnValue(
      new Promise((r) => r(mockProgramMetrics)),
    );
    mockProgramsApi.getMetricsByIdWithCondition.and.returnValue(
      new Promise((r) => r(mockProgramMetrics)),
    );
    mockProgramsApi.getPastInstallments.and.returnValue(
      new Promise((r) => r(mockPastInstallments)),
    );

    mockPastPaymentsService = TestBed.get(PastPaymentsService);
    mockPastPaymentsService.getInstallmentsWithDates.and.returnValue(
      new Promise((r) => r(mockPastInstallmentsWithDates)),
    );
    mockPastPaymentsService.getInstallmentYearMonths.and.returnValue(
      new Promise((r) => r(mockPastInstallmentsWithDates)),
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
    testHost.program = fixtureProgram;

    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(mockProgramsApi.getMetricsById).toHaveBeenCalledWith(
      fixtureProgram.id,
    );
  });

  it('should request the "past-payments" data for the provided program', async () => {
    testHost.program = fixtureProgram;

    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(
      mockPastPaymentsService.getInstallmentsWithDates,
    ).toHaveBeenCalledWith(fixtureProgram.id);
    expect(
      mockPastPaymentsService.getInstallmentYearMonths,
    ).toHaveBeenCalledWith(fixtureProgram.id);
  });

  it('should request the specific metrics for the most-recent payment', async () => {
    testHost.program = fixtureProgram;
    const mockLastInstallmentId = mockPastInstallments[0].id;

    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(mockProgramsApi.getMetricsByIdWithCondition).toHaveBeenCalledWith(
      fixtureProgram.id,
      `installment=${mockLastInstallmentId}`,
    );
  });

  it('should request the specific metrics for the most-recent month', async () => {
    testHost.program = fixtureProgram;
    const mockLastInstallmentDate = new Date(
      mockPastInstallments[0].installmentDate,
    );

    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(mockProgramsApi.getMetricsByIdWithCondition).toHaveBeenCalledWith(
      fixtureProgram.id,
      `year=${mockLastInstallmentDate.getFullYear()}&month=${mockLastInstallmentDate.getMonth()}`,
    );
  });

  it('should request the metrics (again) when triggered from the interface', async () => {
    testHost.program = fixtureProgram;

    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(mockProgramsApi.getMetricsById).toHaveBeenCalledTimes(1);
    expect(mockProgramsApi.getMetricsByIdWithCondition).toHaveBeenCalledTimes(
      2,
    );
    document.getElementById('refresh').click();

    expect(mockProgramsApi.getMetricsById).toHaveBeenCalledTimes(2);
    expect(mockProgramsApi.getMetricsByIdWithCondition).toHaveBeenCalledTimes(
      2,
    );
  });
});
