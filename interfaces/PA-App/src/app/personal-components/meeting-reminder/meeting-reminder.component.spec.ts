import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetingReminderComponent } from './meeting-reminder.component';
import { TranslateModule } from '@ngx-translate/core';
import { QRCodeModule } from 'angularx-qrcode';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ConversationService } from 'src/app/services/conversation.service';
import { MockPaDataService } from 'src/app/mocks/padata.service.mock';
import { PaDataService } from 'src/app/services/padata.service';

describe('MeetingReminderComponent', () => {
  let component: MeetingReminderComponent;
  let fixture: ComponentFixture<MeetingReminderComponent>;

  beforeEach(async(() => {
    const conversationService = jasmine.createSpyObj('ConversationService', {
      startLoading: jasmine.createSpy(),
      stopLoading: jasmine.createSpy(),
      onSectionCompleted: jasmine.createSpy(),
    });

    TestBed.configureTestingModule({
      declarations: [MeetingReminderComponent],
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        QRCodeModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ConversationService,
          useValue: conversationService,
        },
        {
          provide: PaDataService,
          useValue: MockPaDataService,
        },
      ],
    }).compileComponents();
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
