import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { ProgramPeopleAffectedComponent } from './program-people-affected.component';
import { UserRole } from 'src/app/auth/user-role.enum';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { provideMagicalMock } from 'src/app/mocks/helpers';

describe('ProgramPeopleAffectedComponent', () => {
  let component: ProgramPeopleAffectedComponent;
  let fixture: ComponentFixture<ProgramPeopleAffectedComponent>;

  const mockProgramId = 1;
  const mockUserRole = UserRole.ProgramManager;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramPeopleAffectedComponent],
      imports: [TranslateModule.forRoot(), FormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideMagicalMock(ProgramsServiceApiService)],
    }).compileComponents();
  }));

  let mockProgramsApi: jasmine.SpyObj<ProgramsServiceApiService>;

  beforeEach(() => {
    mockProgramsApi = TestBed.get(ProgramsServiceApiService);
    mockProgramsApi.getProgramById.and.returnValue(
      new Promise((r) => r(apiProgramsMock.programs[mockProgramId])),
    );
    mockProgramsApi.getPeopleAffected.and.returnValue(
      new Promise((r) => r([])),
    );

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
