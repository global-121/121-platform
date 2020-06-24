import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { PhaseNextComponent } from './phase-next.component';
import { AuthService } from 'src/app/auth/auth.service';
import { ProgramPhaseService } from 'src/app/services/program-phase.service';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ProgramPhase } from 'src/app/models/program.model';

describe('PhaseNextComponent', () => {
  let component: PhaseNextComponent;
  let fixture: ComponentFixture<PhaseNextComponent>;

  const mockProgramId = 1;

  const mockUserRole = UserRole.ProjectOfficer;
  const mockAuthService = jasmine.createSpyObj('AuthService', ['getUserRole']);
  mockAuthService.getUserRole.and.returnValue(mockUserRole);

  const mockProgramPhase = ProgramPhase.design;
  const mockProgramPhaseService = jasmine.createSpyObj('ProgramPhaseService', [
    'getPhases',
    'getActivePhase',
  ]);
  mockProgramPhaseService.getPhases.and.returnValue([]);
  mockProgramPhaseService.getActivePhase.and.returnValue(mockProgramPhase);

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
