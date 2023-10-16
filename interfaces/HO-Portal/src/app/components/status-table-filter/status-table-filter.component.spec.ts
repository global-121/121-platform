import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FilterService } from 'src/app/services/filter.service';
import { StatusTableFilterComponent } from './status-table-filter.component';

describe('StatusTableFilterComponent', () => {
  let component: StatusTableFilterComponent;
  let fixture: ComponentFixture<StatusTableFilterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [StatusTableFilterComponent],
      imports: [
        IonicModule.forRoot(),
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [FilterService],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusTableFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
