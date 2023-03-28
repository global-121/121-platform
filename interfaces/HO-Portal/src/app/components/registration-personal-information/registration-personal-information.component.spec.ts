import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { RegistrationPersonalInformationComponent } from './registration-personal-information.component';

describe('RegistrationPersonalInformationComponent', () => {
  let component: RegistrationPersonalInformationComponent;
  let fixture: ComponentFixture<RegistrationPersonalInformationComponent>;

  beforeEach(async () => {
    const modalSpy = jasmine.createSpyObj('Modal', ['present']);
    const modalCtrlSpy = jasmine.createSpyObj('ModalController', ['create']);
    modalCtrlSpy.create.and.callFake(() => modalSpy);

    await TestBed.configureTestingModule({
      declarations: [RegistrationPersonalInformationComponent],
      imports: [HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        {
          provide: ModalController,
          useValue: modalCtrlSpy,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrationPersonalInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
