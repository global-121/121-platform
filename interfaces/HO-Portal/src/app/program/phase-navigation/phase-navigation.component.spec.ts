import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramPhase } from 'src/app/models/program.model';
import {
  Phase,
  ProgramPhaseService,
} from 'src/app/services/program-phase.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PhaseNavigationComponent } from './phase-navigation.component';

describe('PhaseNavigationComponent', () => {
  let component: PhaseNavigationComponent;
  let fixture: ComponentFixture<PhaseNavigationComponent>;

  const mockProgramId = 1;
  const mockProgramPhase: Phase = {
    id: 1,
    name: ProgramPhase.design,
    label: 'label',
    btnText: 'btnText',
    active: true,
  };

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [PhaseNavigationComponent],
        imports: [TranslateModule.forRoot(), RouterTestingModule],
        providers: [
          provideMagicalMock(ProgramsServiceApiService),
          provideMagicalMock(ProgramPhaseService),
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents();
    }),
  );

  let mockProgramsApi: jasmine.SpyObj<any>;
  let mockProgramPhaseService: jasmine.SpyObj<any>;

  beforeEach(() => {
    mockProgramsApi = TestBed.inject(ProgramsServiceApiService);
    mockProgramsApi.getProgramById.and.returnValue(
      new Promise((r) => r(apiProgramsMock.programs[mockProgramId])),
    );

    mockProgramPhaseService = TestBed.inject(ProgramPhaseService);
    mockProgramPhaseService.getActivePhase.and.returnValue(mockProgramPhase);

    fixture = TestBed.createComponent(PhaseNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
