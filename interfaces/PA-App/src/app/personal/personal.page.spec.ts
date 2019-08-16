import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PersonalPage } from './personal.page';
import { TranslateModule } from '@ngx-translate/core';

import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import mockCountriesResponse from '../mocks/api.countries.mock';

describe('PersonalPage', () => {
  let component: PersonalPage;
  let fixture: ComponentFixture<PersonalPage>;

  let getAllCountriesSpy;

  beforeEach(async(() => {
    // Mock the used service:
    const programsServiceApiService = jasmine.createSpyObj('ProgramsServiceApiService', ['getCountries']);
    getAllCountriesSpy = programsServiceApiService.getCountries.and.returnValue(of(mockCountriesResponse.countries));

    TestBed.configureTestingModule({
      declarations: [PersonalPage],
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

  beforeEach(async () => {
    fixture = await TestBed.createComponent(PersonalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should request all countries from the server', () => {
    const getCountriesButton = document.getElementById('debugGetCountries');
    getCountriesButton.click();

    expect(getAllCountriesSpy.calls.any()).toBe(true, 'getAllCountries called');
  });

});
