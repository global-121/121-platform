import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrationValidationPage } from './registration-validation.page';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from 'src/app/auth/auth.service';
import { UserRole } from 'src/app/auth/user-role.enum';

describe('RegistrationValidationPage', () => {
  let component: RegistrationValidationPage;
  let fixture: ComponentFixture<RegistrationValidationPage>;

  const mockUserRole = UserRole.ProjectOfficer;
  const mockAuthService = jasmine.createSpyObj('AuthService', ['getUserRole']);
  mockAuthService.getUserRole.and.returnValue(mockUserRole);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RegistrationValidationPage],
      imports: [TranslateModule.forRoot(), RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrationValidationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
