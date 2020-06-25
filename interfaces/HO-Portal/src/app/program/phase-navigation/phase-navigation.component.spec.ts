import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { PhaseNavigationComponent } from './phase-navigation.component';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { ProgramPhase } from 'src/app/models/program.model';
import {
  ProgramPhaseService,
  Phase,
} from 'src/app/services/program-phase.service';
import { provideMagicalMock } from 'src/app/mocks/helpers';

describe('PhaseNavigationComponent', () => {
  let component: PhaseNavigationComponent;
  let fixture: ComponentFixture<PhaseNavigationComponent>;

  const mockProgramPhase: Phase = {
    id: 1,
    name: ProgramPhase.design,
    path: 'path',
    label: 'label',
    btnText: 'btnText',
    active: true,
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PhaseNavigationComponent],
      imports: [TranslateModule.forRoot(), RouterTestingModule],
      providers: [provideMagicalMock(ProgramPhaseService)],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  let mockProgramPhaseService: jasmine.SpyObj<ProgramPhaseService>;
  beforeEach(() => {
    mockProgramPhaseService = TestBed.get(ProgramPhaseService);
    mockProgramPhaseService.getActivePhase.and.returnValue(mockProgramPhase);

    fixture = TestBed.createComponent(PhaseNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
