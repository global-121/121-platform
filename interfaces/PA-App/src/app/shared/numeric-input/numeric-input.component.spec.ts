import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NumericInputComponent } from './numeric-input.component';

describe('NumericInputComponent', () => {
  let component: NumericInputComponent;
  let fixture: ComponentFixture<NumericInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NumericInputComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NumericInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
