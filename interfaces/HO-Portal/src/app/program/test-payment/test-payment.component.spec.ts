import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TestPaymentComponent } from './test-payment.component';

describe('TestPaymentComponent', () => {
  let component: TestPaymentComponent;
  let fixture: ComponentFixture<TestPaymentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TestPaymentComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
