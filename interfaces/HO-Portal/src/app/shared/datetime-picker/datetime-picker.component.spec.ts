import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { provideMagicalMock } from '../../mocks/helpers';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';

import { DatetimePickerComponent } from './datetime-picker.component';

describe('DatetimePickerComponent', () => {
  let component: DatetimePickerComponent;
  let fixture: ComponentFixture<DatetimePickerComponent>;

  beforeEach(() => {
    const modalSpy = jasmine.createSpyObj('Modal', ['present']);
    const modalCtrlSpy = jasmine.createSpyObj('ModalController', ['create']);
    modalCtrlSpy.create.and.callFake(() => modalSpy);
    TestBed.configureTestingModule({
      declarations: [DatetimePickerComponent],
      imports: [IonicModule, TranslateModule.forRoot()],
      providers: [
        {
          provide: ModalController,
          useValue: modalCtrlSpy,
        },
        provideMagicalMock(ProgramsServiceApiService),
        provideMagicalMock(ErrorHandlerService),
      ],
    });
    fixture = TestBed.createComponent(DatetimePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
