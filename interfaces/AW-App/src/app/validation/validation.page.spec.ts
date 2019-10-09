import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidationPage } from './validation.page';
import { TranslateModule } from '@ngx-translate/core';

import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { ConversationService } from '../services/conversation.service';

describe('ValidationPage', () => {
  let component: ValidationPage;
  let fixture: ComponentFixture<ValidationPage>;

  beforeEach(async(() => {
    // Mock the used services:
    const programsServiceApiService = jasmine.createSpyObj('ProgramsServiceApiService', ['getCountries']);
    const conversationService = jasmine.createSpyObj('ConversationService', { getConversationUpToNow: [{}, {}] });

    TestBed.configureTestingModule({
      declarations: [ValidationPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        TranslateModule.forRoot(),
      ],
      providers: [
        {
          provide: ProgramsServiceApiService,
          useValue: programsServiceApiService,
        },
        {
          provide: ConversationService,
          useValue: conversationService,
        }
      ]
    }).compileComponents();
  }));

  beforeEach(async () => {
    fixture = await TestBed.createComponent(ValidationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });

});
