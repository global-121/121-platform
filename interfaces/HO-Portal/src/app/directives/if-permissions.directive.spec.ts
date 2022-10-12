import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../auth/auth.service';
import Permission from '../auth/permission.enum';
import { provideMagicalMock } from '../mocks/helpers';
import { IfPermissionsDirective } from './if-permissions.directive';

const mockText = 'TEST';
const mockProgramId = 1;

@Component({
  template: `<div *appIfPermissions="conditions">${mockText}</div>`,
})
class TestComponent {
  conditions = [];
}

describe('IfPermissionsDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let el: HTMLElement;

  let mockAuthService: jasmine.SpyObj<any>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestComponent, IfPermissionsDirective],
      imports: [RouterTestingModule],
      providers: [
        provideMagicalMock(AuthService),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                id: mockProgramId,
              },
            },
          },
        },
      ],
    }).compileComponents();

    mockAuthService = TestBed.inject(AuthService);

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    el = fixture.debugElement.nativeElement;
  });

  it('should create an instance', () => {
    expect(fixture).toBeTruthy();
  });

  it('should show the component when RequiredPermissions are undefined', () => {
    component.conditions = undefined;
    mockAuthService.hasAllPermissions.and.returnValue(true);

    fixture.detectChanges();

    expect(mockAuthService.hasAllPermissions).toHaveBeenCalledTimes(1);
    expect(el.innerText).toBe(mockText);
  });

  it('should show the component when RequiredPermissions match', () => {
    component.conditions = [Permission.Test];
    mockAuthService.hasAllPermissions.and.returnValue(true);

    fixture.detectChanges();

    expect(mockAuthService.hasAllPermissions).toHaveBeenCalledTimes(1);
    expect(el.innerText).toBe(mockText);
  });

  it('should NOT show the component when RequiredPermissions do NOT match', () => {
    component.conditions = [Permission.Test];
    mockAuthService.hasAllPermissions.and.returnValue(false);

    fixture.detectChanges();

    expect(mockAuthService.hasAllPermissions).toHaveBeenCalledTimes(1);
    expect(el.innerText).not.toBe(mockText);
  });
});
