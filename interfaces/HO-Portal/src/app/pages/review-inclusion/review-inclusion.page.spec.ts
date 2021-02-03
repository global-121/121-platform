import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { UserRole } from 'src/app/auth/user-role.enum';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ReviewInclusionPage } from './review-inclusion.page';

describe('ReviewInclusionPage', () => {
  let component: ReviewInclusionPage;
  let fixture: ComponentFixture<ReviewInclusionPage>;

  const mockUserRoles = [UserRole.RunProgram];

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ReviewInclusionPage],
      imports: [TranslateModule.forRoot(), RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideMagicalMock(AuthService)],
    }).compileComponents();
  }));

  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    mockAuthService = TestBed.get(AuthService);
    mockAuthService.getUserRoles.and.returnValue(mockUserRoles);

    fixture = TestBed.createComponent(ReviewInclusionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
