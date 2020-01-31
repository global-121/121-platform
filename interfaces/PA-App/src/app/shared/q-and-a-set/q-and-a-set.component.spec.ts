import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QAndASetComponent } from './q-and-a-set.component';

describe('QAndASetComponent', () => {
  let component: QAndASetComponent;
  let fixture: ComponentFixture<QAndASetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QAndASetComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QAndASetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
