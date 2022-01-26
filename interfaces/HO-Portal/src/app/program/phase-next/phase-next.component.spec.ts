import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramPhase } from 'src/app/models/program.model';
import {
  Phase,
  ProgramPhaseService,
} from 'src/app/services/program-phase.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PhaseNextComponent } from './phase-next.component';

describe('PhaseNextComponent', () => {
  let component: PhaseNextComponent;
  let fixture: ComponentFixture<PhaseNextComponent>;

  const mockProgramId = 1;
  const mockProgramPhase: Phase = {
    id: 1,
    name: ProgramPhase.design,
    label: 'label',
    btnText: 'btnText',
    active: true,
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PhaseNextComponent],
      imports: [HttpClientTestingModule, RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideMagicalMock(ProgramsServiceApiService),
        provideMagicalMock(ProgramPhaseService),
      ],
    }).compileComponents();
  }));

  let mockProgramsApi: jasmine.SpyObj<any>;
  let mockProgramPhaseService: jasmine.SpyObj<any>;

  beforeEach(() => {
    mockProgramsApi = TestBed.inject(ProgramsServiceApiService);
    mockProgramsApi.getProgramById.and.returnValue(
      new Promise((r) => r(apiProgramsMock.programs[mockProgramId])),
    );

    mockProgramPhaseService = TestBed.inject(ProgramPhaseService);
    mockProgramPhaseService.getPhases.and.returnValue(
      new Promise((r) => r([mockProgramPhase])),
    );
    mockProgramPhaseService.getActivePhase.and.returnValue(mockProgramPhase);
    mockProgramPhaseService.getPhaseByName.and.returnValue(mockProgramPhase);

    fixture = TestBed.createComponent(PhaseNextComponent);
    component = fixture.componentInstance;

    component.programId = mockProgramId;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
