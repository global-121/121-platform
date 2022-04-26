import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MockConversationService } from 'src/app/mocks/conversation.service.mock';
import { ConversationService } from 'src/app/services/conversation.service';
import { ConsentQuestionComponent } from './consent-question.component';

describe('ConsentQuestionComponent', () => {
  let component: ConsentQuestionComponent;
  let fixture: ComponentFixture<ConsentQuestionComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ConsentQuestionComponent],
        imports: [TranslateModule.forRoot(), HttpClientTestingModule],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        providers: [
          {
            provide: ConversationService,
            useValue: MockConversationService,
          },
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsentQuestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
