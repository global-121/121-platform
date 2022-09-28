import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { DisableRegistrationComponent } from './disable-registration.component';

describe('DisableRegistrationComponent', () => {
  let component: DisableRegistrationComponent;
  let fixture: ComponentFixture<DisableRegistrationComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [DisableRegistrationComponent],
        imports: [TranslateModule.forRoot(), RouterTestingModule],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        providers: [
          provideMagicalMock(AuthService),
          provideMagicalMock(ProgramsServiceApiService),
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DisableRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
