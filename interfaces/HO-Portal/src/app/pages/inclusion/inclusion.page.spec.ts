import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { UserRole } from 'src/app/auth/user-role.enum';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { InclusionPage } from './inclusion.page';

describe('InclusionPage', () => {
  let component: InclusionPage;
  let fixture: ComponentFixture<InclusionPage>;

  const mockUserRole = UserRole.ProjectOfficer;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InclusionPage],
      imports: [TranslateModule.forRoot(), RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideMagicalMock(AuthService)],
    }).compileComponents();
  }));

  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    mockAuthService = TestBed.get(AuthService);
    mockAuthService.getUserRole.and.returnValue(mockUserRole);

    fixture = TestBed.createComponent(InclusionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
