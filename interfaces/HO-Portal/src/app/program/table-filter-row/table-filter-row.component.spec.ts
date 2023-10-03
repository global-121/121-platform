import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FilterService } from 'src/app/services/filter.service';

import { TableFilterRowComponent } from './table-filter-row.component';

describe('TableFilterRowComponent', () => {
  let component: TableFilterRowComponent;
  let fixture: ComponentFixture<TableFilterRowComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TableFilterRowComponent],
      imports: [IonicModule, FormsModule, TranslateModule.forRoot()],
      providers: [FilterService],
    });
    fixture = TestBed.createComponent(TableFilterRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
