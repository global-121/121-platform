import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { AuthService } from 'src/app/auth/auth.service';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { ProgramPayoutComponent } from './program-payout.component';
import { UserRole } from 'src/app/auth/user-role.enum';

describe('ProgramPayoutComponent', () => {
  let component: ProgramPayoutComponent;
  let fixture: ComponentFixture<ProgramPayoutComponent>;

  const mockUserRole = UserRole.ProjectOfficer;
  const mockAuthService = jasmine.createSpyObj('AuthService', ['getUserRole']);
  mockAuthService.getUserRole.and.returnValue(mockUserRole);

  const mockProgramId = 1;
  const mockProgramsApi = jasmine.createSpyObj('ProgramsServiceApiService', [
    'getProgramById',
    'getTotalIncluded',
    'getPastInstallments',
  ]);
  mockProgramsApi.getProgramById.and.returnValue(
    apiProgramsMock.programs[mockProgramId],
  );
  mockProgramsApi.getTotalIncluded.and.returnValue(0);
  mockProgramsApi.getPastInstallments.and.returnValue([]);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramPayoutComponent],
      imports: [TranslateModule.forRoot(), FormsModule],
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
    fixture = TestBed.createComponent(ProgramPayoutComponent);
    component = fixture.componentInstance;
    component.programId = mockProgramId;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
