import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ProgramPayoutComponent } from './program-payout.component';

describe('ProgramPayoutComponent', () => {
  let component: ProgramPayoutComponent;
  let fixture: ComponentFixture<ProgramPayoutComponent>;

  const mockProgramId = 1;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramPayoutComponent],
      imports: [TranslateModule.forRoot(), FormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideMagicalMock(AuthService),
        provideMagicalMock(ProgramsServiceApiService),
      ],
    }).compileComponents();
  }));

  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockProgramsApi: jasmine.SpyObj<ProgramsServiceApiService>;

  beforeEach(() => {
    mockAuthService = TestBed.get(AuthService);

    mockProgramsApi = TestBed.get(ProgramsServiceApiService);
    mockProgramsApi.getProgramById.and.returnValue(
      new Promise((r) => r(apiProgramsMock.programs[mockProgramId])),
    );
    mockProgramsApi.getTotalIncluded.and.returnValue(new Promise((r) => r(0)));
    mockProgramsApi.getPastInstallments.and.returnValue(
      new Promise((r) => r([])),
    );

    fixture = TestBed.createComponent(ProgramPayoutComponent);
    component = fixture.componentInstance;

    component.programId = mockProgramId;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
