import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { InstallmentData } from 'src/app/models/installment.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { MakePaymentComponent } from './make-payment.component';

describe('MakePaymentComponent', () => {
  let component: MakePaymentComponent;
  let fixture: ComponentFixture<MakePaymentComponent>;

  const mockProgramId = 1;
  const mockInstallmentData: InstallmentData = {
    id: 0,
    amount: 1,
    installmentDate: new Date(),
  };
  const mockPastInstallments = [
    {
      ...mockInstallmentData,
      id: 1,
    },
    {
      ...mockInstallmentData,
      id: 2,
    },
  ];
  const mockLastInstallmentId = 2;

  let mockProgramsApi: jasmine.SpyObj<ProgramsServiceApiService>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MakePaymentComponent],
      imports: [TranslateModule.forRoot(), FormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideMagicalMock(ProgramsServiceApiService)],
    }).compileComponents();
  }));

  beforeEach(() => {
    mockProgramsApi = TestBed.get(ProgramsServiceApiService);

    mockProgramsApi.getTotalIncluded.and.returnValue(new Promise((r) => r(2)));
    mockProgramsApi.getPastInstallments.and.returnValue(
      new Promise((r) => r(mockPastInstallments)),
    );
    mockProgramsApi.getLastInstallmentId.and.returnValue(
      new Promise((r) => r(mockLastInstallmentId)),
    );

    fixture = TestBed.createComponent(MakePaymentComponent);
    component = fixture.componentInstance;

    component.program = apiProgramsMock.programs[mockProgramId];
    component.program.distributionDuration = mockPastInstallments.length + 1;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be disabled when 0 PA are included', async () => {
    mockProgramsApi.getTotalIncluded.and.returnValue(new Promise((r) => r(0)));

    await fixture.detectChanges();

    await expect(mockProgramsApi.getTotalIncluded).toHaveBeenCalledTimes(1);
    expect(component.isEnabled).toBeFalse();
  });

  it('should be enabled when 1(+) PA are included', async () => {
    mockProgramsApi.getTotalIncluded.and.returnValue(new Promise((r) => r(1)));

    await fixture.detectChanges();

    await expect(mockProgramsApi.getTotalIncluded).toHaveBeenCalledTimes(1);
    expect(component.isEnabled).toBeTrue();
  });

  it('should be disabled when all installments are done', async () => {
    component.program.distributionDuration = mockPastInstallments.length;

    await fixture.detectChanges();

    await expect(mockProgramsApi.getLastInstallmentId).toHaveBeenCalledTimes(1);
    expect(component.isEnabled).toBeFalse();
  });
});
