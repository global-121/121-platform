import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { MetricsComponent } from './metrics.component';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ProgramMetrics } from 'src/app/models/program-metrics.model';
import { Program, ProgramPhase } from 'src/app/models/program.model';

@Component({
  template: `<app-metrics [program]="program" [selectedPhase]="selectedPhase"></app-metrics>`,
})
class TestHostComponent {
  program: Program | any;
  selectedPhase: ProgramPhase;
}

describe('MetricsComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let testHost: TestHostComponent;
  let componentElement: HTMLElement;

  const fixtureProgram = {
    id: 1,
  };
  let mockProgramsApi: any;
  const mockProgramMetrics: ProgramMetrics = {
    updated: new Date().toISOString(),
    pa: {
      included: 1,
      excluded: 1,
      pendingVerification: 1,
      verifiedAwaitingDecision: 1,
    },
    funding: {
      totalRaised: 10,
      totalTransferred: 7,
      totalAvailable: 3,
    },
  };

  beforeEach(async(() => {
    mockProgramsApi = jasmine.createSpyObj('ProgramsServiceApiService', [
      'getMetricsById',
    ]);
    mockProgramsApi.getMetricsById.and.returnValue(mockProgramMetrics);

    TestBed.configureTestingModule({
      declarations: [
        MetricsComponent,
        TestHostComponent,
      ],
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ProgramsServiceApiService,
          useValue: mockProgramsApi,
        },
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    testHost = fixture.componentInstance;
    componentElement = fixture.nativeElement.querySelector('app-metrics');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(testHost).toBeTruthy();
  });

  it('should request the metrics for the provided program', () => {
    testHost.program = fixtureProgram;
    fixture.detectChanges();

    expect(mockProgramsApi.getMetricsById).toHaveBeenCalledWith(fixtureProgram.id);
  });

  it('should request the metrics when triggered from the interface', () => {
    testHost.program = fixtureProgram;
    fixture.detectChanges();

    expect(mockProgramsApi.getMetricsById).toHaveBeenCalledTimes(1);

    componentElement.querySelector('ion-button').click();

    expect(mockProgramsApi.getMetricsById).toHaveBeenCalledTimes(2);
    expect(mockProgramsApi.getMetricsById).toHaveBeenCalledWith(fixtureProgram.id);
  });

});
