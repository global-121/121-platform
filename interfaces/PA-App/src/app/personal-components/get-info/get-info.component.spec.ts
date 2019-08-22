import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GetInfoComponent } from './get-info.component';
import { TranslateModule } from '@ngx-translate/core';

describe('GetInfoComponent', () => {
  let component: GetInfoComponent;
  let fixture: ComponentFixture<GetInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GetInfoComponent],
      imports: [
        TranslateModule.forRoot(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GetInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
