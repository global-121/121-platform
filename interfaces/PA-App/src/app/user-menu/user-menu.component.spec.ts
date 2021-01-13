import { MockLoggingService } from './../mocks/logging.service.mock';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {
  AlertController,
  LoadingController,
  ModalController,
} from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MockPaDataService } from 'src/app/mocks/padata.service.mock';
import { PaDataService } from 'src/app/services/padata.service';
import { UserMenuComponent } from './user-menu.component';
import { LoggingService } from '../services/logging.service';

describe('UserMenuComponent', () => {
  let component: UserMenuComponent;
  let fixture: ComponentFixture<UserMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UserMenuComponent],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ModalController,
        },
        {
          provide: PaDataService,
          useValue: MockPaDataService,
        },
        {
          provide: AlertController,
        },
        {
          provide: LoadingController,
        },
        {
          provide: LoggingService,
          useValue: MockLoggingService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
