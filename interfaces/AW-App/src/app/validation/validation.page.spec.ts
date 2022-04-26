import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Storage } from '@ionic/storage';
import { TranslateModule } from '@ngx-translate/core';
import { ConversationService } from '../services/conversation.service';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { ValidationPage } from './validation.page';

describe('ValidationPage', () => {
  let component: ValidationPage;
  let fixture: ComponentFixture<ValidationPage>;

  beforeEach(
    waitForAsync(() => {
      // Mock the used services:
      const programsServiceApiService = jasmine.createSpyObj(
        'ProgramsServiceApiService',
      );
      const conversationService = jasmine.createSpyObj('ConversationService', {
        state: { isLoading: false },
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
            useValue: storageIonicMock,
          },
        ],
      }).compileComponents();
    }),
  );

  beforeEach(async () => {
    fixture = await TestBed.createComponent(ValidationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
