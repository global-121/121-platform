import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderComponent } from './header.component';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { UserRole } from 'src/app/auth/user-role.enum';
import { AuthService } from 'src/app/auth/auth.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  const mockUserRole = UserRole.ProjectOfficer;
  const mockAuthService = jasmine.createSpyObj('AuthService', ['getUserRole']);
  mockAuthService.getUserRole.and.returnValue(mockUserRole);

  const mockProgramId = 1;
  const mockProgramsApi = jasmine.createSpyObj('ProgramsServiceApiService', [
    'getProgramById',
  ]);
  mockProgramsApi.getProgramById.and.returnValue(
    apiProgramsMock.programs[mockProgramId],
  );

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      imports: [TranslateModule.forRoot(), RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ProgramsServiceApiService,
          useValue: mockProgramsApi,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
