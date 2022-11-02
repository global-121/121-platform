import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import apiProgramMetricsMock from 'src/app/mocks/api.program-metrics.mock';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramMetrics } from 'src/app/models/program-metrics.model';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { MetricsTotalsComponent } from './metrics-totals.component';

@Component({
  template: `<app-metrics-totals [program]="program"></app-metrics-totals>`,
})
class TestHostComponent {
  program: Program | any;
}

describe('MetricsTotalsComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let testHost: TestHostComponent;

  const mockProgramMetrics: ProgramMetrics = apiProgramMetricsMock;

  const fixtureProgram = apiProgramsMock.programs[0];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MetricsTotalsComponent, TestHostComponent],
      imports: [
        TranslateModule.forRoot(),
        FormsModule,
        SharedModule,
        NoopAnimationsModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideMagicalMock(ProgramsServiceApiService)],
    }).compileComponents();
  }));

  let mockProgramsApi: jasmine.SpyObj<any>;

  beforeEach(() => {
    mockProgramsApi = TestBed.inject(ProgramsServiceApiService);
    mockProgramsApi.getMetricsById.and.returnValue(
      new Promise((r) => r(mockProgramMetrics)),
    );

    fixture = TestBed.createComponent(TestHostComponent);
    testHost = fixture.componentInstance;

    testHost.program = fixtureProgram;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(testHost).toBeTruthy();
  });

  it('should request the metrics for the provided program', async () => {
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

  it('should request the metrics (again) when triggered from the interface', async () => {
    // Arrange
    testHost.program = fixtureProgram;

    // Act
    fixture.autoDetectChanges();
    await fixture.whenStable();

    // Assert
    expect(mockProgramsApi.getMetricsById).toHaveBeenCalledTimes(1);
    document.getElementById('refresh').click();

    expect(mockProgramsApi.getMetricsById).toHaveBeenCalledTimes(2);
  });
});
