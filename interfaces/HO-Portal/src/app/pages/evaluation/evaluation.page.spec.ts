import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluationPage } from './evaluation.page';
import { TranslateModule } from '@ngx-translate/core';

describe('EvaluationPage', () => {
  let component: EvaluationPage;
  let fixture: ComponentFixture<EvaluationPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EvaluationPage],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EvaluationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
