import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { PhaseNextComponent } from './phase-next.component';

describe('PhaseNextComponent', () => {
  let component: PhaseNextComponent;
  let fixture: ComponentFixture<PhaseNextComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PhaseNextComponent],
      imports: [
        HttpClientTestingModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PhaseNextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
