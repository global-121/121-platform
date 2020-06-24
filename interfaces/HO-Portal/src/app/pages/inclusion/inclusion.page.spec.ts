import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { InclusionPage } from './inclusion.page';
import { UserRole } from 'src/app/auth/user-role.enum';
import { AuthService } from 'src/app/auth/auth.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('InclusionPage', () => {
  let component: InclusionPage;
  let fixture: ComponentFixture<InclusionPage>;

  const mockUserRole = UserRole.ProjectOfficer;
  const mockAuthService = jasmine.createSpyObj('AuthService', ['getUserRole']);
  mockAuthService.getUserRole.and.returnValue(mockUserRole);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InclusionPage],
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
    fixture = TestBed.createComponent(InclusionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
