import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { ChooseCredentialTypeComponent } from './choose-credential-type.component';

describe('ChooseCredentialTypeComponent', () => {
  let component: ChooseCredentialTypeComponent;
  let fixture: ComponentFixture<ChooseCredentialTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ChooseCredentialTypeComponent],
      imports: [
        TranslateModule.forRoot(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChooseCredentialTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
