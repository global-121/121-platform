import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { NoConnectionService } from 'src/app/services/no-connection.service';
import { StorageService } from '../../services/storage.service';
import { MainMenuComponent } from './main-menu.component';

describe('MainMenuComponent', () => {
  let component: MainMenuComponent;
  let fixture: ComponentFixture<MainMenuComponent>;

  beforeEach(waitForAsync(() => {
    const storageIonicMock: any = {
      get: () => new Promise<any>((resolve) => resolve('1')),
    };

    TestBed.configureTestingModule({
      declarations: [MainMenuComponent],
      imports: [
        TranslateModule.forRoot(),
        RouterTestingModule,
        HttpClientTestingModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: StorageService,
          useValue: storageIonicMock,
        },
        {
          provide: NoConnectionService,
        },
        {
          provide: AuthService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
