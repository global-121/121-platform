import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MockConversationService } from 'src/app/mocks/conversation.service.mock';
import { MockPaDataService } from 'src/app/mocks/padata.service.mock';
import { PaInclusionStates } from 'src/app/models/pa-statuses.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { InclusionStatusComponent } from './inclusion-status.component';

describe('InclusionStatusComponent', () => {
  let component: InclusionStatusComponent;
  let fixture: ComponentFixture<InclusionStatusComponent>;

  const mockProgramsApi: jasmine.SpyObj<any> = jasmine.createSpyObj(
    'ProgramsServiceApiService',
    {
      checkInclusionStatus: new Promise((r) => r(PaInclusionStates.included)),
    },
  );

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InclusionStatusComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        TranslateModule.forRoot(),
        RouterModule.forRoot([]),
        HttpClientTestingModule,
      ],
      providers: [
        {
          provide: ConversationService,
          useValue: MockConversationService,
        },
        {
          provide: PaDataService,
          useValue: MockPaDataService,
        },
        {
          provide: ProgramsServiceApiService,
          useValue: mockProgramsApi,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InclusionStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
