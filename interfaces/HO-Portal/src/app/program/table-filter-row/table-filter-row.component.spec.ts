import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { TableFilterRowComponent } from './table-filter-row.component';

describe('TableFilterRowComponent', () => {
  let component: TableFilterRowComponent;
  let fixture: ComponentFixture<TableFilterRowComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TableFilterRowComponent],
      imports: [TranslateModule.forRoot()],
    });
    fixture = TestBed.createComponent(TableFilterRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
