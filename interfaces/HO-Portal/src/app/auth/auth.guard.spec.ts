import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import Permission from './permission.enum';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: AuthService;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        AuthGuard,
        AuthService,
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access if no specific permissions are required and the user is logged in', () => {
    // Arrange
    spyOn(authService, 'isLoggedIn').and.returnValue(true);
    const testRoute = {
      url: '/test',
      params: {},
      data: {},
    } as any;

    // Act
    const result = guard.canActivate(testRoute, null);

    // Assert
    expect(authService.isLoggedIn).toHaveBeenCalledWith();
    expect(result).toBe(true);
  });

  it('should allow access if the user has all required permissions', () => {
    // Arrange
    spyOn(authService, 'hasAllPermissions').and.returnValue(true);
    const testProgramId = 1;
    const testPermissions = [
      Permission.RegistrationStatusSelectedForValidationUPDATE,
    ];

    // Act
    const result = guard.canActivate(
      {
        params: { id: testProgramId },
        data: { permissions: testPermissions },
      } as any,
      null,
    );

    // Assert
    expect(result).toBe(true);
    expect(authService.hasAllPermissions).toHaveBeenCalledWith(
      testProgramId,
      testPermissions,
    );
  });

  it('should redirect to login if the user is not logged in', () => {
    // Arrange
    spyOn(authService, 'isLoggedIn').and.returnValue(false);
    const testUrl = '/home';

    // Act
    const result = guard.canActivate(
      {
        url: testUrl,
        params: {},
        data: {},
      } as any,
      { url: testUrl } as any,
    );

    // Assert
    expect(result).toBe(false);
    expect(authService.redirectUrl).toBe(testUrl);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/', 'login']);
  });

  it('should redirect to login if the user does not have all required permissions', () => {
    // Arrange
    spyOn(authService, 'hasAllPermissions').and.returnValue(false);
    const testProgramId = 1;
    const testUrl = `/program/${testProgramId}}`;
    const testPermissions = [
      Permission.RegistrationStatusSelectedForValidationUPDATE,
    ];

    // Act
    const result = guard.canActivate(
      {
        url: testUrl,
        params: { id: testProgramId },
        data: { permissions: testPermissions },
      } as any,
      { url: testUrl } as any,
    );

    // Assert
    expect(result).toBe(false);
    expect(authService.redirectUrl).toBe(testUrl);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/', 'login']);
  });
});
