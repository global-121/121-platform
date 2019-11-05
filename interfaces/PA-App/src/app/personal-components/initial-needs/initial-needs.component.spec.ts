import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InitialNeedsComponent } from './initial-needs.component';
import { TranslateModule } from '@ngx-translate/core';
import { ConversationService } from 'src/app/services/conversation.service';

describe('InitialNeedsComponent', () => {
  let component: InitialNeedsComponent;
  let fixture: ComponentFixture<InitialNeedsComponent>;

  beforeEach(async(() => {
    const conversationService = jasmine.createSpy();

    TestBed.configureTestingModule({
      declarations: [InitialNeedsComponent],
      imports: [
        TranslateModule.forRoot(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ConversationService,
          useValue: conversationService,
        },
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InitialNeedsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
