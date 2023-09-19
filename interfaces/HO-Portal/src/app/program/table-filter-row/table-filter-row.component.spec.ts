import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableFilterRowComponent } from './table-filter-row.component';

describe('TableFilterRowComponent', () => {
  let component: TableFilterRowComponent;
  let fixture: ComponentFixture<TableFilterRowComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TableFilterRowComponent],
    });
    fixture = TestBed.createComponent(TableFilterRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
