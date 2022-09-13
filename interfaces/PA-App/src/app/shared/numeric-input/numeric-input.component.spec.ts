import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NumericInputComponent } from './numeric-input.component';

describe('NumericInputComponent', () => {
  let component: NumericInputComponent;
  let fixture: ComponentFixture<NumericInputComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [NumericInputComponent],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(NumericInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
