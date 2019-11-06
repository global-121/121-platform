import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetingReminderComponent } from './meeting-reminder.component';
import { TranslateModule } from '@ngx-translate/core';
import { QRCodeModule } from 'angularx-qrcode';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Storage } from '@ionic/storage';
import { MockIonicStorage } from 'src/app/mocks/ionic.storage.mock';

describe('MeetingReminderComponent', () => {
  let component: MeetingReminderComponent;
  let fixture: ComponentFixture<MeetingReminderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MeetingReminderComponent],
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        QRCodeModule
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: Storage,
          useValue: MockIonicStorage,
        },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MeetingReminderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
