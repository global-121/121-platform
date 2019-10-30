import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { Storage } from '@ionic/storage';
import { MockIonicStorage } from 'src/app/mocks/ionic.storage.mock';

import { CreateIdentityComponent } from './create-identity.component';

describe('CreatePasswordComponent', () => {
  let component: CreateIdentityComponent;
  let fixture: ComponentFixture<CreateIdentityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateIdentityComponent],
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: Storage,
          useValue: MockIonicStorage,
        },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateIdentityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
