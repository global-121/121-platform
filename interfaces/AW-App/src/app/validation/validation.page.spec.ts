import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidationPage } from './validation.page';
import { TranslateModule } from '@ngx-translate/core';
import { Storage } from '@ionic/storage';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { ConversationService } from '../services/conversation.service';

describe('ValidationPage', () => {
  let component: ValidationPage;
  let fixture: ComponentFixture<ValidationPage>;

  beforeEach(async(() => {
    // Mock the used services:
    const programsServiceApiService = jasmine.createSpyObj('ProgramsServiceApiService', ['getCountries']);
    const conversationService = jasmine.createSpyObj('ConversationService', {
      state: { isLoading: false, },
      sectionCompleted$: jasmine.createSpy(),
      shouldScroll$: jasmine.createSpy(),
      getConversationUpToNow: [{}, {}],
    });
    const storageIonicMock: any = {
      get: () => new Promise<any>((resolve) => resolve('1')),
    };

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
        },
        {
          provide: Storage,
          useValue: storageIonicMock,
        },
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
