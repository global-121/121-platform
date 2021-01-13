import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MockLoggingService } from 'src/app/mocks/logging.service.mock';
import { LoggingService } from 'src/app/services/logging.service';
import { PasswordToggleInputComponent } from './password-toggle-input.component';

describe('PasswordToggleInputComponent', () => {
  let component: PasswordToggleInputComponent;
  let fixture: ComponentFixture<PasswordToggleInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PasswordToggleInputComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: LoggingService,
          useValue: MockLoggingService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PasswordToggleInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
