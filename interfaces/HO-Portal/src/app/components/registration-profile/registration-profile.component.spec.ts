import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';

import { RegistrationProfileComponent } from './registration-profile.component';

describe('RegistrationProfileComponent', () => {
  let component: RegistrationProfileComponent;
  let fixture: ComponentFixture<RegistrationProfileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RegistrationProfileComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        {
          provide: AuthService,
        },
      ],
    });
    fixture = TestBed.createComponent(RegistrationProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
