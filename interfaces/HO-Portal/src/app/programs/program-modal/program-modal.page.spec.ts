import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramModalPage } from './program-modal.page';

describe('ProgramModalPage', () => {
  let component: ProgramModalPage;
  let fixture: ComponentFixture<ProgramModalPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProgramModalPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
