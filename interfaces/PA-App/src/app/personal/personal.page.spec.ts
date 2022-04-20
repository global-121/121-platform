import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs/internal/Observable';
import { MockConversationService } from '../mocks/conversation.service.mock';
import { MockLoggingService } from '../mocks/logging.service.mock';
import { ConversationService } from '../services/conversation.service';
import { LoggingService } from '../services/logging.service';
import { PersonalPage } from './personal.page';

describe('PersonalPage', () => {
  let component: PersonalPage;
  let fixture: ComponentFixture<PersonalPage>;

  beforeEach(
    waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PersonalPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [TranslateModule.forRoot(), HttpClientTestingModule],
      providers: [
        {
          provide: ConversationService,
          useValue: MockConversationService,
        },
        {
          provide: LoggingService,
          useValue: MockLoggingService,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: new Observable((observer) => {
              const urlParams = {
                mode: 'batch',
              };
              observer.next(urlParams);
              observer.complete();
            }),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(async () => {
    fixture = await TestBed.createComponent(PersonalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
