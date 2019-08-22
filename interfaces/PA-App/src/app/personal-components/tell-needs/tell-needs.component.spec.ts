import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TellNeedsComponent } from './tell-needs.component';
import { TranslateModule } from '@ngx-translate/core';

describe('TellNeedsComponent', () => {
  let component: TellNeedsComponent;
  let fixture: ComponentFixture<TellNeedsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TellNeedsComponent],
      imports: [
        TranslateModule.forRoot(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TellNeedsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
