import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { UserPage } from './user.page';

describe('UserPage', () => {
  let component: UserPage;
  let fixture: ComponentFixture<UserPage>;

  const authServiceMock = {
    authenticationState$: of(null),
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UserPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [FormsModule, TranslateModule.forRoot(), RouterTestingModule],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
