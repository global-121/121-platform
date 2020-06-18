import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrationValidationPage } from './registration-validation.page';
import { TranslateModule } from '@ngx-translate/core';

describe('RegistrationValidationPage', () => {
  let component: RegistrationValidationPage;
  let fixture: ComponentFixture<RegistrationValidationPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RegistrationValidationPage],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrationValidationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
