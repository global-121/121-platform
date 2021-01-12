import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage';
import { TranslateModule } from '@ngx-translate/core';
import { MockConversationService } from '../mocks/conversation.service.mock';
import { MockIonicStorage } from '../mocks/ionic.storage.mock';
import { ConversationService } from '../services/conversation.service';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { PersonalPage } from './personal.page';

describe('PersonalPage', () => {
  let component: PersonalPage;
  let fixture: ComponentFixture<PersonalPage>;

  beforeEach(async(() => {
    // Mock the used services:
    const programsServiceApiService = jasmine.createSpyObj(
      'ProgramsServiceApiService',
    );

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
          useValue: MockConversationService,
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
