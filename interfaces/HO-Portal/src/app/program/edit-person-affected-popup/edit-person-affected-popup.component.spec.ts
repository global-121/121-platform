import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import RegistrationStatus from '../../enums/registration-status.enum';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { EditPersonAffectedPopupComponent } from './edit-person-affected-popup.component';

describe('EditPersonAffectedPopupComponent', () => {
  let component: EditPersonAffectedPopupComponent;
  let fixture: ComponentFixture<EditPersonAffectedPopupComponent>;

  const mockProgramId = 1;

  beforeEach(waitForAsync(() => {
    const modalSpy = jasmine.createSpyObj('Modal', ['present']);
    const modalCtrlSpy = jasmine.createSpyObj('ModalController', ['create']);
    modalCtrlSpy.create.and.callFake(() => modalSpy);

    TestBed.configureTestingModule({
      declarations: [EditPersonAffectedPopupComponent],
      imports: [
        IonicModule,
        TranslateModule.forRoot(),
        HttpClientTestingModule,
      ],
      providers: [
        {
          provide: ModalController,
          useValue: modalCtrlSpy,
        },
        provideMagicalMock(ProgramsServiceApiService),
        provideMagicalMock(ErrorHandlerService),
      ],
    }).compileComponents();
  }));

  let mockProgramsApi: jasmine.SpyObj<any>;

  beforeEach(() => {
    mockProgramsApi = TestBed.inject(ProgramsServiceApiService);
    mockProgramsApi.getProgramById.and.returnValue(
      new Promise((r) => r(apiProgramsMock.programs[mockProgramId])),
    );
    mockProgramsApi.getPeopleAffected.and.returnValue(
      new Promise((r) =>
        r([
          {
            id: 1,
            personAffectedSequence: '1',
            referenceId: 'test',
            registrationProgramId: 1,
            status: RegistrationStatus.startedRegistration,
            programId: 1,
          },
        ]),
      ),
    );

    fixture = TestBed.createComponent(EditPersonAffectedPopupComponent);
    component = fixture.componentInstance;

    component.person = {
      id: 1,
      personAffectedSequence: '1',
      referenceId: 'test',
      registrationProgramId: 1,
      status: RegistrationStatus.startedRegistration,
      programId: 1,
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
