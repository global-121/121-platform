import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalPage } from './personal.page';
import { TranslateModule } from '@ngx-translate/core';

import { Storage } from '@ionic/storage';
import { MockIonicStorage } from '../mocks/ionic.storage.mock';

import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { ConversationService } from '../services/conversation.service';

describe('PersonalPage', () => {
  let component: PersonalPage;
  let fixture: ComponentFixture<PersonalPage>;

  beforeEach(async(() => {
    // Mock the used services:
    const programsServiceApiService = jasmine.createSpyObj(
      'ProgramsServiceApiService',
      ['getCountries'],
    );
    const conversationService = jasmine.createSpyObj('ConversationService', {
      getConversationUpToNow: [{}, {}],
    });

    TestBed.configureTestingModule({
      declarations: [PersonalPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [TranslateModule.forRoot()],
      providers: [
        {
          provide: ProgramsServiceApiService,
          useValue: programsServiceApiService,
        },
        {
          provide: ConversationService,
          useValue: conversationService,
        },
        {
          provide: Storage,
          useValue: MockIonicStorage,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(async () => {
    fixture = await TestBed.createComponent(PersonalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
