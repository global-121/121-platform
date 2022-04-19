import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MockLoggingService } from 'src/app/mocks/logging.service.mock';
import { LoggingService } from 'src/app/services/logging.service';
import { PasswordToggleInputComponent } from './password-toggle-input.component';

describe('PasswordToggleInputComponent', () => {
  let component: PasswordToggleInputComponent;
  let fixture: ComponentFixture<PasswordToggleInputComponent>;

  beforeEach(
    waitForAsync(() => {
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
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PasswordToggleInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
