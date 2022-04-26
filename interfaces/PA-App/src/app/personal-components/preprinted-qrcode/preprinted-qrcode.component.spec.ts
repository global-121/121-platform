import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AngularDelegate, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MockConversationService } from 'src/app/mocks/conversation.service.mock';
import { MockPaDataService } from 'src/app/mocks/padata.service.mock';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';
import { PreprintedQrcodeComponent } from './preprinted-qrcode.component';

describe('PreprintedQrcodeComponent', () => {
  let component: PreprintedQrcodeComponent;
  let fixture: ComponentFixture<PreprintedQrcodeComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [PreprintedQrcodeComponent],
        imports: [TranslateModule.forRoot(), HttpClientTestingModule],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
            provide: ModalController,
          },
          {
            provide: AngularDelegate,
          },
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PreprintedQrcodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
