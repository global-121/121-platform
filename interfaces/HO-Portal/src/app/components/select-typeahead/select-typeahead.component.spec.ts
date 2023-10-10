import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { SelectTypeaheadComponent } from './select-typeahead.component';

describe('SelectTypeaheadComponent', () => {
  let component: SelectTypeaheadComponent;
  let fixture: ComponentFixture<SelectTypeaheadComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        SelectTypeaheadComponent,
        IonicModule.forRoot(),
        TranslateModule.forRoot(),
      ],
    });
    fixture = TestBed.createComponent(SelectTypeaheadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
