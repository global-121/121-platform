import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramMetrics } from 'src/app/models/program-metrics.model';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { MetricsComponent } from './metrics.component';

@Component({
  template: `<app-metrics [program]="program"></app-metrics>`,
})
class TestHostComponent {
  program: Program | any;
}

describe('MetricsComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let testHost: TestHostComponent;

  const fixtureProgram = apiProgramsMock.programs[0];
  const mockProgramMetrics: ProgramMetrics = {
    updated: new Date().toISOString(),
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MetricsComponent, TestHostComponent],
      imports: [TranslateModule.forRoot(), HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideMagicalMock(TranslatableStringService),
        provideMagicalMock(ProgramsServiceApiService),
      ],
    }).compileComponents();
  }));

  let mockTranslatableStringService: jasmine.SpyObj<TranslatableStringService>;
  let mockProgramsApi: jasmine.SpyObj<ProgramsServiceApiService>;

  beforeEach(() => {
    mockProgramsApi = TestBed.get(ProgramsServiceApiService);
    mockProgramsApi.getMetricsById.and.returnValue(
      new Promise((r) => r(mockProgramMetrics)),
    );

    mockTranslatableStringService = TestBed.get(TranslatableStringService);
    mockTranslatableStringService.get.and.returnValue('');

    fixture = TestBed.createComponent(TestHostComponent);
    testHost = fixture.componentInstance;

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
