import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePasswordComponent } from './create-password.component';
import { TranslateModule } from '@ngx-translate/core';

describe('CreatePasswordComponent', () => {
  let component: CreatePasswordComponent;
  let fixture: ComponentFixture<CreatePasswordComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreatePasswordComponent],
      imports: [
        TranslateModule.forRoot(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
