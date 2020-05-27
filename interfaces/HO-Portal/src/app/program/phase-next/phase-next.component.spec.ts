import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { PhaseNextComponent } from './phase-next.component';
import { AuthService } from 'src/app/auth/auth.service';

describe('PhaseNextComponent', () => {
  let component: PhaseNextComponent;
  let fixture: ComponentFixture<PhaseNextComponent>;

  const authServiceMock = {
    authenticationState$: of(null),
    getUserRole: () => '',
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PhaseNextComponent],
      imports: [HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PhaseNextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
