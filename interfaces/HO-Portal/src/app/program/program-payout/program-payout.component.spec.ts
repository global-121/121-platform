import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { PastPaymentsService } from 'src/app/services/past-payments.service';
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
        provideMagicalMock(PastPaymentsService),
        {
          provide: AlertController,
        },
      ],
    }).compileComponents();
  }));

  let mockAuthService: jasmine.SpyObj<any>;
  let mockProgramsApi: jasmine.SpyObj<any>;

  beforeEach(() => {
    mockAuthService = TestBed.inject(AuthService);
    mockAuthService.hasUserRole.and.returnValue(true);

    mockProgramsApi = TestBed.inject(ProgramsServiceApiService);
    mockProgramsApi.getProgramById.and.returnValue(
      new Promise((r) => r(apiProgramsMock.programs[mockProgramId])),
    );
    mockProgramsApi.getTotalTransferAmounts.and.returnValue(
      new Promise((r) => r({ registrations: 0, transferAmounts: 0 })),
    );
    mockProgramsApi.getPastPayments.and.returnValue(new Promise((r) => r([])));

    fixture = TestBed.createComponent(ProgramPayoutComponent);
    component = fixture.componentInstance;

    component.programId = mockProgramId;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
