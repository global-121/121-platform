import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrationPersonalInformationComponent } from './registration-personal-information.component';

describe('RegistrationPersonalInformationComponent', () => {
  let component: RegistrationPersonalInformationComponent;
  let fixture: ComponentFixture<RegistrationPersonalInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegistrationPersonalInformationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrationPersonalInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
