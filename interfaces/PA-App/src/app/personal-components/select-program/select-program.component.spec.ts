import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { MockConversationService } from 'src/app/mocks/conversation.service.mock';
import { MockInstanceService } from 'src/app/mocks/instance.service.mock';
import { MockPaDataService } from 'src/app/mocks/padata.service.mock';
import { ConversationService } from 'src/app/services/conversation.service';
import { InstanceService } from 'src/app/services/instance.service';
import { LoggingService } from 'src/app/services/logging.service';
import { PaDataService } from 'src/app/services/padata.service';
import { SelectProgramComponent } from './select-program.component';

describe('SelectProgramComponent', () => {
  let component: SelectProgramComponent;
  let fixture: ComponentFixture<SelectProgramComponent>;

  const modalSpy = jasmine.createSpyObj('Modal', ['present']);
  const modalCtrlSpy = jasmine.createSpyObj('ModalController', ['create']);
  modalCtrlSpy.create.and.callFake(() => {
    return modalSpy;
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SelectProgramComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [TranslateModule.forRoot(), HttpClientTestingModule],
      providers: [
        {
          provide: PaDataService,
          useValue: MockPaDataService,
        },
        {
          provide: ConversationService,
          useValue: MockConversationService,
        },
        {
          provide: InstanceService,
          useValue: MockInstanceService,
        },
        {
          provide: ModalController,
          useValue: modalCtrlSpy,
        },
        {
          provide: LoggingService,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: new Observable((observer) => {
              const urlParams = {
                programs: '1,2',
              };
              observer.next(urlParams);
              observer.complete();
            }),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectProgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
