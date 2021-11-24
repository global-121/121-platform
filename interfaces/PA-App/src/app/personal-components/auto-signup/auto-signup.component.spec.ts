import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MockConversationService } from 'src/app/mocks/conversation.service.mock';
import { MockLoggingService } from 'src/app/mocks/logging.service.mock';
import { ConversationService } from 'src/app/services/conversation.service';
import { LoggingService } from 'src/app/services/logging.service';
import { AutoSignupComponent } from './auto-signup.component';

describe('AutoSignupComponent', () => {
  let component: AutoSignupComponent;
  let fixture: ComponentFixture<AutoSignupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AutoSignupComponent],
      imports: [TranslateModule.forRoot(), HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ConversationService,
          useValue: MockConversationService,
        },
        {
          provide: LoggingService,
          useValue: MockLoggingService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoSignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
