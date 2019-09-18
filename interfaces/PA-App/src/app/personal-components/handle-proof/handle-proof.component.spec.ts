import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage';

import { HandleProofComponent } from './handle-proof.component';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterModule } from '@angular/router';

describe('HandleProofComponent', () => {
  let component: HandleProofComponent;
  let fixture: ComponentFixture<HandleProofComponent>;

  const storageIonicMock: any = {
    get: () => new Promise<any>((resolve, reject) => resolve('1')),
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HandleProofComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        TranslateModule.forRoot(),
        RouterModule.forRoot([]),
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: Storage,
          useValue: storageIonicMock
        }
      ]
    })
      .compileComponents();
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
