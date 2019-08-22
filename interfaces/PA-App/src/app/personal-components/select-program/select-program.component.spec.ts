import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage';

import { SelectProgramComponent } from './select-program.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SelectProgramComponent', () => {
  let component: SelectProgramComponent;
  let fixture: ComponentFixture<SelectProgramComponent>;

  const storageIonicMock: any = {
    get: () => new Promise<any>((resolve, reject) => resolve('1')),
  };

  beforeEach(async(() => {
    // Mock the used service:
    const programsServiceApiService = jasmine.createSpyObj('ProgramsServiceApiService', ['getCountries']);

    TestBed.configureTestingModule({
      declarations: [SelectProgramComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: Storage,
          useValue: storageIonicMock
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectProgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
