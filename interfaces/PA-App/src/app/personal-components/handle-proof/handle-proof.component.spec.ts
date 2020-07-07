import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { Storage } from '@ionic/storage';
import { TranslateModule } from '@ngx-translate/core';
import { MockIonicStorage } from 'src/app/mocks/ionic.storage.mock';
import { MockPaDataService } from 'src/app/mocks/padata.service.mock';
import { PaDataService } from 'src/app/services/padata.service';
import { HandleProofComponent } from './handle-proof.component';

describe('HandleProofComponent', () => {
  let component: HandleProofComponent;
  let fixture: ComponentFixture<HandleProofComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HandleProofComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        TranslateModule.forRoot(),
        RouterModule.forRoot([]),
        HttpClientTestingModule,
      ],
      providers: [
        {
          provide: Storage,
          useValue: MockIonicStorage,
        },
        {
          provide: PaDataService,
          useValue: MockPaDataService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HandleProofComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
