import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { PaDataService } from 'src/app/services/padata.service';
import { MockPaDataService } from 'src/app/mocks/padata.service.mock';
import { ModalController } from '@ionic/angular';

import { PreprintedQrcodeComponent } from './preprinted-qrcode.component';

describe('PreprintedQrcodeComponent', () => {
  let component: PreprintedQrcodeComponent;
  let fixture: ComponentFixture<PreprintedQrcodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PreprintedQrcodeComponent],
      imports: [TranslateModule.forRoot(), HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: PaDataService,
          useValue: MockPaDataService,
        },
        {
          provide: ModalController,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreprintedQrcodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
