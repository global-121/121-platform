import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { AuthService } from 'src/app/auth/auth.service';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { ProgramPayoutComponent } from './program-payout.component';

describe('ProgramPayoutComponent', () => {
  let component: ProgramPayoutComponent;
  let fixture: ComponentFixture<ProgramPayoutComponent>;

  const authServiceMock = {
    authenticationState$: of(null),
  };

  const mockProgramId = 1;
  const mockProgramsApi = jasmine.createSpyObj('ProgramsServiceApiService', [
    'getProgramById',
    'getTotalIncluded',
  ]);
  mockProgramsApi.getProgramById.and.returnValue(
    apiProgramsMock.programs[mockProgramId],
  );
  mockProgramsApi.getTotalIncluded.and.returnValue(0);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramPayoutComponent],
      imports: [TranslateModule.forRoot(), FormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
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
