import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { PaStatus } from 'src/app/models/person.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { EditPersonAffectedPopupComponent } from './edit-person-affected-popup.component';

const modalSpy = jasmine.createSpyObj('Modal', ['present']);
const modalCtrlSpy = jasmine.createSpyObj('ModalController', ['create']);
modalCtrlSpy.create.and.callFake(() => {
  return modalSpy;
});

describe('EditPersonAffectedPopupComponent', () => {
  let component: EditPersonAffectedPopupComponent;
  let fixture: ComponentFixture<EditPersonAffectedPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditPersonAffectedPopupComponent],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ModalController,
          useValue: modalCtrlSpy,
        },
        provideMagicalMock(ProgramsServiceApiService),
      ],
    }).compileComponents();
  }));

  let mockProgramsApi: jasmine.SpyObj<ProgramsServiceApiService>;

  beforeEach(() => {
    mockProgramsApi = TestBed.get(ProgramsServiceApiService);
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
      status: PaStatus.created,
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
