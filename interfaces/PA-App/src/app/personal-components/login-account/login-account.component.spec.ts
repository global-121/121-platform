import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MockConversationService } from 'src/app/mocks/conversation.service.mock';
import { MockPaDataService } from 'src/app/mocks/padata.service.mock';
import { ConversationService } from 'src/app/services/conversation.service';
import { LoggingService } from 'src/app/services/logging.service';
import { PaDataService } from 'src/app/services/padata.service';
import { MockLoggingService } from '../../mocks/logging.service.mock';
import { LoginAccountComponent } from './login-account.component';

describe('LoginAccountComponent', () => {
  let component: LoginAccountComponent;
  let fixture: ComponentFixture<LoginAccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LoginAccountComponent],
      imports: [TranslateModule.forRoot(), HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ConversationService,
          useValue: MockConversationService,
        },
        {
          provide: PaDataService,
          useValue: MockPaDataService,
        },
        {
          provide: LoggingService,
          useValue: MockLoggingService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
