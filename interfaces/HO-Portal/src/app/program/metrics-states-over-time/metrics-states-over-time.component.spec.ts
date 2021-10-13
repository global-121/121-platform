import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { getRandomInt, provideMagicalMock } from 'src/app/mocks/helpers';
import { Program } from 'src/app/models/program.model';
import { PastPaymentsService } from 'src/app/services/past-payments.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { MetricsStatesOverTimeComponent } from './metrics-states-over-time.component';

@Component({
  template: `<app-metrics-states-over-time
    [program]="program"
  ></app-metrics-states-over-time>`,
})
class TestHostComponent {
  program: Program | any;
}

describe('MetricsStatesOverTimeComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let testHost: TestHostComponent;

  const mockPastPaymentsWithStateSums = [
    {
      id: 1,
      values: {
        'pre-existing': getRandomInt(0, 100),
        new: getRandomInt(0, 100),
      },
    },
    {
      id: 2,
      values: {
        'pre-existing': getRandomInt(0, 100),
        new: getRandomInt(0, 100),
      },
    },
  ];

  const fixtureProgram = apiProgramsMock.programs[0];

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MetricsStatesOverTimeComponent, TestHostComponent],
      imports: [
        TranslateModule.forRoot(),
        FormsModule,
        SharedModule,
        NoopAnimationsModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideMagicalMock(PastPaymentsService)],
    }).compileComponents();
  }));

  let mockPastPaymentsService: jasmine.SpyObj<PastPaymentsService>;

  beforeEach(() => {
    mockPastPaymentsService = TestBed.get(PastPaymentsService);
    mockPastPaymentsService.getPaymentsWithStateSums.and.returnValue(
      new Promise((r) => r(mockPastPaymentsWithStateSums)),
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
    testHost.program = fixtureProgram;

    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(
      mockPastPaymentsService.getPaymentsWithStateSums,
    ).toHaveBeenCalledWith(fixtureProgram.id);
  });

  it('should request the metrics (again) when triggered from the interface', async () => {
    testHost.program = fixtureProgram;

    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(
      mockPastPaymentsService.getPaymentsWithStateSums,
    ).toHaveBeenCalledTimes(1);
    document.getElementById('refresh').click();

    expect(
      mockPastPaymentsService.getPaymentsWithStateSums,
    ).toHaveBeenCalledTimes(2);
  });
});
