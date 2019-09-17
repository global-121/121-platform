import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HandleProofComponent } from './handle-proof.component';

describe('HandleProofComponent', () => {
  let component: HandleProofComponent;
  let fixture: ComponentFixture<HandleProofComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HandleProofComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HandleProofComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
