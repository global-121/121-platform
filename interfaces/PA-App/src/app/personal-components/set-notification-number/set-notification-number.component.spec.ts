import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MockConversationService } from 'src/app/mocks/conversation.service.mock';
import { MockPaDataService } from 'src/app/mocks/padata.service.mock';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';
import { SetNotificationNumberComponent } from './set-notification-number.component';

describe('SetNotificationNumberComponent', () => {
  let component: SetNotificationNumberComponent;
  let fixture: ComponentFixture<SetNotificationNumberComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [SetNotificationNumberComponent],
        imports: [TranslateModule.forRoot(), HttpClientTestingModule],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        providers: [
          {
            provide: PaDataService,
            useValue: MockPaDataService,
          },
          {
            provide: ConversationService,
            useValue: MockConversationService,
          },
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(SetNotificationNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
