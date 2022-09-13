import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MockConversationService } from 'src/app/mocks/conversation.service.mock';
import { MockInstanceService } from 'src/app/mocks/instance.service.mock';
import { MockPaDataService } from 'src/app/mocks/padata.service.mock';
import { ConversationService } from 'src/app/services/conversation.service';
import { InstanceService } from 'src/app/services/instance.service';
import { PaDataService } from 'src/app/services/padata.service';
import { EnrollInProgramComponent } from './enroll-in-program.component';

describe('EnrollInProgramComponent', () => {
  let component: EnrollInProgramComponent;
  let fixture: ComponentFixture<EnrollInProgramComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [EnrollInProgramComponent],
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
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(EnrollInProgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
