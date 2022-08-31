import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AngularDelegate, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MockLoggingService } from 'src/app/mocks/logging.service.mock';
import { LoggingService } from 'src/app/services/logging.service';
import { MoreInfoButtonComponent } from './more-info-button.component';

describe('MoreInfoButtonComponent', () => {
  let component: MoreInfoButtonComponent;
  let fixture: ComponentFixture<MoreInfoButtonComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MoreInfoButtonComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [TranslateModule.forRoot()],
      providers: [
        {
          provide: ModalController,
        },
        {
          provide: AngularDelegate,
        },
        {
          provide: LoggingService,
          useValue: MockLoggingService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MoreInfoButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
