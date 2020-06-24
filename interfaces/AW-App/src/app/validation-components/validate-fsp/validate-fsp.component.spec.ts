import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidateFspComponent } from './validate-fsp.component';

describe('ValidateFspComponent', () => {
  let component: ValidateFspComponent;
  let fixture: ComponentFixture<ValidateFspComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ValidateFspComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidateFspComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
