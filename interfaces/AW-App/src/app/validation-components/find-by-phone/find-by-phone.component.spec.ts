import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Storage } from '@ionic/storage';
import { TranslateModule } from '@ngx-translate/core';
import { ConversationService } from 'src/app/services/conversation.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { FindByPhoneComponent } from './find-by-phone.component';

const storageIonicMock: any = {
  get: () => new Promise<any>((resolve) => resolve('1')),
};

describe('FindByPhoneComponent', () => {
  let component: FindByPhoneComponent;
  let fixture: ComponentFixture<FindByPhoneComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [FindByPhoneComponent],
        imports: [
          TranslateModule.forRoot(),
          HttpClientTestingModule,
          FormsModule,
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        providers: [
          {
            provide: ProgramsServiceApiService,
          },
          {
            provide: ConversationService,
          },
          {
            provide: Storage,
            useValue: storageIonicMock,
          },
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(FindByPhoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
