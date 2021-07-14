import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { getRandomInt, provideMagicalMock } from 'src/app/mocks/helpers';
import { PaStatus } from 'src/app/models/person.model';
import { ProgramMetrics } from 'src/app/models/program-metrics.model';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
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
      imports: [TranslateModule.forRoot(), FormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideMagicalMock(ProgramsServiceApiService)],
    }).compileComponents();
  }));

  let mockProgramsApi: jasmine.SpyObj<ProgramsServiceApiService>;

  beforeEach(() => {
    mockProgramsApi = TestBed.get(ProgramsServiceApiService);
    mockProgramsApi.getMetricsById.and.returnValue(
      new Promise((r) => r(mockProgramMetrics)),
    );
    mockProgramsApi.getMetricsByIdWithCondition.and.returnValue(
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

  it('should request the metrics for the provided program', () => {
    testHost.program = fixtureProgram;
    fixture.detectChanges();

    expect(mockProgramsApi.getMetricsById).toHaveBeenCalledWith(
      fixtureProgram.id,
    );
  });

  it('should request the metrics (again) when triggered from the interface', () => {
    testHost.program = fixtureProgram;
    fixture.detectChanges();

    expect(mockProgramsApi.getMetricsById).toHaveBeenCalledTimes(1);

    document.getElementById('metrics-update').click();

    expect(mockProgramsApi.getMetricsById).toHaveBeenCalledTimes(2);
  });
});
