import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PhaseNavigationComponent } from './phase-navigation.component';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { ProgramPhase } from 'src/app/models/program.model';
import { ProgramPhaseService } from 'src/app/services/program-phase.service';

describe('PhaseNavigationComponent', () => {
  let component: PhaseNavigationComponent;
  let fixture: ComponentFixture<PhaseNavigationComponent>;

  const mockProgramPhase = ProgramPhase.design;
  const mockProgramPhaseService = jasmine.createSpyObj('ProgramPhaseService', [
    'getPhases',
    'getActivePhase',
  ]);
  mockProgramPhaseService.getPhases.and.returnValue([]);
  mockProgramPhaseService.getActivePhase.and.returnValue(mockProgramPhase);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PhaseNavigationComponent],
      imports: [TranslateModule.forRoot(), RouterTestingModule],
      providers: [
        {
          provide: ProgramPhaseService,
          useValue: mockProgramPhaseService,
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PhaseNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
