import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramListComponent } from './program-list.component';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ProgramListComponent', () => {
  let component: ProgramListComponent;
  let fixture: ComponentFixture<ProgramListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramListComponent],
      imports: [
        TranslateModule.forRoot(),
        RouterModule.forRoot([]),
        HttpClientTestingModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
