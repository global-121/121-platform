import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectFspComponent } from './select-fsp.component';
import { TranslateModule } from '@ngx-translate/core';
import { PaDataService } from 'src/app/services/padata.service';
import { MockPaDataService } from 'src/app/mocks/padata.service.mock';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SelectFspComponent', () => {
  let component: SelectFspComponent;
  let fixture: ComponentFixture<SelectFspComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SelectFspComponent],
      imports: [TranslateModule.forRoot(), HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: PaDataService,
          useValue: MockPaDataService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectFspComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
