import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Tab2Page } from './tab2.page';
import mockCountriesResponse from '../mocks/api.countries.mock';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { TranslateModule } from '@ngx-translate/core';

describe('Tab2Page', () => {
  let component: Tab2Page;
  let fixture: ComponentFixture<Tab2Page>;

  let getAllCountriesSpy;

  beforeEach(async(() => {
    // Mock the used service:
    const programsServiceApiService = jasmine.createSpyObj('ProgramsServiceApiService', ['getCountries']);
    getAllCountriesSpy = programsServiceApiService.getCountries.and.returnValue(of(mockCountriesResponse.countries));

    TestBed.configureTestingModule({
      declarations: [Tab2Page],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        TranslateModule.forRoot(),
      ],
      providers: [
        {
          provide: ProgramsServiceApiService,
          useValue: programsServiceApiService,
        },
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Tab2Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });

  // it('should request all programs from the server', () => {
  //   expect(getAllCountriesSpy.calls.any()).toBe(true, 'getAllCountries called');
  // });

});
