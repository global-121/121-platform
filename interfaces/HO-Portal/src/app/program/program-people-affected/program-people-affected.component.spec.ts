import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ModalController, PopoverController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { AuthService } from 'src/app/auth/auth.service';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { ProgramPeopleAffectedComponent } from './program-people-affected.component';

describe('ProgramPeopleAffectedComponent', () => {
  let component: ProgramPeopleAffectedComponent;
  let fixture: ComponentFixture<ProgramPeopleAffectedComponent>;

  const mockProgramId = 1;

  beforeEach(waitForAsync(() => {
    const modalSpy = jasmine.createSpyObj('Modal', ['present']);
    const modalCtrlSpy = jasmine.createSpyObj('ModalController', ['create']);
    modalCtrlSpy.create.and.callFake(() => modalSpy);

    const popoverSpy = jasmine.createSpyObj('Popover', ['present']);
    const popoverCtrlSpy = jasmine.createSpyObj('PopoverController', [
      'create',
    ]);
    popoverCtrlSpy.create.and.callFake(() => popoverSpy);

    TestBed.configureTestingModule({
      declarations: [ProgramPeopleAffectedComponent],
      imports: [
        FormsModule,
        TranslateModule.forRoot(),
        NgxDatatableModule,
        RouterTestingModule,
        SharedModule,
      ],
      providers: [
        provideMagicalMock(AuthService),
        provideMagicalMock(ProgramsServiceApiService),
        provideMagicalMock(ErrorHandlerService),
        {
          provide: ModalController,
          useValue: modalCtrlSpy,
        },
        {
          provide: PopoverController,
          useValue: popoverCtrlSpy,
        },
      ],
    }).compileComponents();
  }));

  let mockProgramsApi: jasmine.SpyObj<any>;

  beforeEach(() => {
    mockProgramsApi = TestBed.inject(ProgramsServiceApiService);
    mockProgramsApi.getProgramById.and.returnValue(
      new Promise((r) => r(apiProgramsMock.programs[mockProgramId])),
    );
    mockProgramsApi.getPastPayments.and.returnValue(new Promise((r) => r([])));
    mockProgramsApi.getPeopleAffected.and.returnValue(
      new Promise((r) => r([])),
    );

    fixture = TestBed.createComponent(ProgramPeopleAffectedComponent);
    component = fixture.componentInstance;

    component.programId = mockProgramId;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
