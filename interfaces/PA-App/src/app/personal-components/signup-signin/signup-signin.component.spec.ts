import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SignupSigninComponent } from './signup-signin.component';
import { TranslateModule } from '@ngx-translate/core';
import { ConversationService } from 'src/app/services/conversation.service';

describe('SignupSigninComponent', () => {
  let component: SignupSigninComponent;
  let fixture: ComponentFixture<SignupSigninComponent>;

  beforeEach(async(() => {
    const conversationService = jasmine.createSpy();

    TestBed.configureTestingModule({
      declarations: [SignupSigninComponent],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ConversationService,
          useValue: conversationService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignupSigninComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
