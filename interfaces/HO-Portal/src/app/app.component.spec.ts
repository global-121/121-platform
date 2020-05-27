import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed, async } from '@angular/core/testing';

import { RouterTestingModule } from '@angular/router/testing';

import { AppComponent } from './app.component';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from './auth/auth.service';

describe('AppComponent', () => {
  const authServiceMock = {
    authenticationState$: of(null),
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
      imports: [TranslateModule.forRoot(), RouterTestingModule.withRoutes([])],
    }).compileComponents();
  }));

  it('should create the app', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have 1 menu item (when logged out)', async () => {
    const fixture = await TestBed.createComponent(AppComponent);
    await fixture.detectChanges();
    const app = fixture.nativeElement;
    const menuItems = app.querySelectorAll('ion-item');
    const menuLabels = app.querySelectorAll('ion-menu ion-list ion-label');
    expect(menuItems.length).toEqual(1);
    expect(menuItems[0].getAttribute('ng-reflect-router-link')).toEqual(
      '/login',
    );
    expect(menuLabels[0].textContent).toContain('LOGIN');
  });
});
