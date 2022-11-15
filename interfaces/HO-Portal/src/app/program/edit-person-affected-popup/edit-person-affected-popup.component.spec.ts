import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import RegistrationStatus from '../../enums/registration-status.enum';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { EditPersonAffectedPopupComponent } from './edit-person-affected-popup.component';

const modalSpy = jasmine.createSpyObj('Modal', ['present']);
const modalCtrlSpy = jasmine.createSpyObj('ModalController', ['create']);
modalCtrlSpy.create.and.callFake(() => {
  return modalSpy;
});

describe('EditPersonAffectedPopupComponent', () => {
  let component: EditPersonAffectedPopupComponent;
  let fixture: ComponentFixture<EditPersonAffectedPopupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [EditPersonAffectedPopupComponent],
      imports: [TranslateModule.forRoot(), HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
    mockProgramsApi.retrieveNote.and.returnValue(
      new Promise((r) =>
        r({
          note: 'test',
          noteUpdated: new Date().toISOString(),
        }),
      ),
    );

    fixture = TestBed.createComponent(EditPersonAffectedPopupComponent);
    component = fixture.componentInstance;

    component.person = {
      id: 1,
      referenceId: 'test',
      registrationProgramId: 1,
      status: RegistrationStatus.startedRegistration,
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
