import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { ReviewInclusionPage } from './review-inclusion.page';
import { RouterTestingModule } from '@angular/router/testing';
import { UserRole } from 'src/app/auth/user-role.enum';
import { AuthService } from 'src/app/auth/auth.service';
import { provideMagicalMock } from 'src/app/mocks/helpers';

describe('ReviewInclusionPage', () => {
  let component: ReviewInclusionPage;
  let fixture: ComponentFixture<ReviewInclusionPage>;

  const mockUserRole = UserRole.ProjectOfficer;

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
    mockAuthService.getUserRole.and.returnValue(mockUserRole);

    fixture = TestBed.createComponent(ReviewInclusionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
