import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from 'src/app/auth/auth.service';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramPhase } from 'src/app/models/program.model';
import {
  Phase,
  ProgramPhaseService,
} from 'src/app/services/program-phase.service';
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
      imports: [HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideMagicalMock(AuthService),
        provideMagicalMock(ProgramPhaseService),
      ],
    }).compileComponents();
  }));

  let mockAuthService: jasmine.SpyObj<any>;
  let mockProgramPhaseService: jasmine.SpyObj<any>;
  beforeEach(() => {
    mockAuthService = TestBed.inject(AuthService);
    mockAuthService.hasUserRole.and.returnValue(true);

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
