import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DateInputComponent } from './date-input.component';

describe('DateInputComponent', () => {
  let component: DateInputComponent;
  let fixture: ComponentFixture<DateInputComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [DateInputComponent],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DateInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
