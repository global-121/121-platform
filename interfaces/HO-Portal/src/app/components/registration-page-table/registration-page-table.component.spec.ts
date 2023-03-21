import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrationPageTableComponent } from './registration-page-table.component';

describe('RegistrationPageTableComponent', () => {
  let component: RegistrationPageTableComponent;
  let fixture: ComponentFixture<RegistrationPageTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegistrationPageTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrationPageTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
