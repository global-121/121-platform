import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Storage } from '@ionic/storage';
import { MockIonicStorage } from 'src/app/mocks/ionic.storage.mock';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { LoginIdentityComponent } from './login-identity.component';

describe('LoginIdentityComponent', () => {
  let component: LoginIdentityComponent;
  let fixture: ComponentFixture<LoginIdentityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LoginIdentityComponent],
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: Storage,
          useValue: MockIonicStorage,
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginIdentityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
