import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IdentityFormComponent } from './identity-form.component';
import { TranslateModule } from '@ngx-translate/core';

describe('IdentityFormComponent', () => {
  let component: IdentityFormComponent;
  let fixture: ComponentFixture<IdentityFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [IdentityFormComponent],
      imports: [
        TranslateModule.forRoot(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IdentityFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
