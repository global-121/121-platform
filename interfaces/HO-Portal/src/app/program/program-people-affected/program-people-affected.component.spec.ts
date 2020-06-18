import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { ProgramPeopleAffectedComponent } from './program-people-affected.component';
import { UserRole } from 'src/app/auth/user-role.enum';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

describe('ProgramPeopleAffectedComponent', () => {
  let component: ProgramPeopleAffectedComponent;
  let fixture: ComponentFixture<ProgramPeopleAffectedComponent>;

  const mockUserRole = UserRole.ProgramManager;
  const mockProgramId = 1;
  const mockProgramsApi = jasmine.createSpyObj('ProgramsServiceApiService', [
    'getProgramById',
    'getPeopleAffected',
  ]);
  mockProgramsApi.getProgramById.and.returnValue(
    apiProgramsMock.programs[mockProgramId],
  );
  mockProgramsApi.getPeopleAffected.and.returnValue([]);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramPeopleAffectedComponent],
      imports: [TranslateModule.forRoot(), FormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ProgramsServiceApiService,
          useValue: mockProgramsApi,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramPeopleAffectedComponent);
    component = fixture.componentInstance;
    component.programId = mockProgramId;
    component.userRole = mockUserRole;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
