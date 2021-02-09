import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramPhase } from 'src/app/models/program.model';
import {
  Phase,
  ProgramPhaseService,
} from 'src/app/services/program-phase.service';
import { ExportListComponent } from './export-list.component';

describe('ExportListComponent', () => {
  let component: ExportListComponent;
  let fixture: ComponentFixture<ExportListComponent>;

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
      declarations: [ExportListComponent],
      imports: [TranslateModule.forRoot(), HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideMagicalMock(AuthService),
        provideMagicalMock(ProgramPhaseService),
      ],
    }).compileComponents();
  }));

  let mockProgramPhaseService: jasmine.SpyObj<ProgramPhaseService>;
  beforeEach(() => {
    mockProgramPhaseService = TestBed.get(ProgramPhaseService);
    mockProgramPhaseService.getActivePhase.and.returnValue(mockProgramPhase);

    fixture = TestBed.createComponent(ExportListComponent);
    component = fixture.componentInstance;

    component.programId = mockProgramId;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
