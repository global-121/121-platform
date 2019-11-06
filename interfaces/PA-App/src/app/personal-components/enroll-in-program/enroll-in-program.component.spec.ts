import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TranslateModule } from '@ngx-translate/core';
import { PaDataService } from 'src/app/services/padata.service';
import { MockPaDataService } from 'src/app/mocks/padata.service.mock';

import { EnrollInProgramComponent } from './enroll-in-program.component';

describe('EnrollInProgramComponent', () => {
  let component: EnrollInProgramComponent;
  let fixture: ComponentFixture<EnrollInProgramComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EnrollInProgramComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: PaDataService,
          useValue: MockPaDataService,
        },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnrollInProgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
