import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AngularDelegate, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MockRegistrationModeService } from '../mocks/registration-mode.service.mock';
import { RegistrationModeService } from '../services/registration-mode.service';
import { MultipleRegistrationsMenuComponent } from './multiple-registrations-menu.component';

describe('MultipleRegistrationsMenuComponent', () => {
  let component: MultipleRegistrationsMenuComponent;
  let fixture: ComponentFixture<MultipleRegistrationsMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MultipleRegistrationsMenuComponent],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ModalController,
        },
        {
          provide: AngularDelegate,
        },
        {
          provide: RegistrationModeService,
          useValue: MockRegistrationModeService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultipleRegistrationsMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
