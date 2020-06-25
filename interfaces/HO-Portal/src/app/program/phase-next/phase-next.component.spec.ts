import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { PhaseNextComponent } from './phase-next.component';
import { AuthService } from 'src/app/auth/auth.service';
import {
  ProgramPhaseService,
  Phase,
} from 'src/app/services/program-phase.service';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ProgramPhase, Program } from 'src/app/models/program.model';
import { camelCase2Kebab } from 'src/app/shared/camelcase-to-kebabcase';

describe('PhaseNextComponent', () => {
  let component: PhaseNextComponent;
  let fixture: ComponentFixture<PhaseNextComponent>;

  const mockProgramId = 1;

  const mockUserRole = UserRole.ProjectOfficer;
  const mockAuthService = jasmine.createSpyObj('AuthService', ['getUserRole']);
  mockAuthService.getUserRole.and.returnValue(mockUserRole);

  const mockProgramPhase: Phase = {
    id: 1,
    name: ProgramPhase.design,
    path: camelCase2Kebab(ProgramPhase.design),
    label: 'label',
    btnText: 'btnText',
    active: true,
  };
  const mockProgramPhaseService = jasmine.createSpyObj('ProgramPhaseService', [
    'getPhases',
    'getActivePhase',
    'getPhaseByName',
  ]);
  mockProgramPhaseService.getPhases.and.returnValue([]);
  mockProgramPhaseService.getActivePhase.and.returnValue(mockProgramPhase);
  mockProgramPhaseService.getPhaseByName.and.returnValue(mockProgramPhase);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PhaseNextComponent],
      imports: [HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ProgramPhaseService,
          useValue: mockProgramPhaseService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PhaseNextComponent);
    component = fixture.componentInstance;
    component.programId = mockProgramId;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
