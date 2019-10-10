import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage';
import { MockIonicStorage } from 'src/app/mocks/ionic.storage.mock';
import { of } from 'rxjs';

import { SelectCountryComponent } from './select-country.component';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import mockCountriesResponse from '../../mocks/api.countries.mock';
import { TranslateModule } from '@ngx-translate/core';

describe('SelectCountryComponent', () => {
  let component: SelectCountryComponent;
  let fixture: ComponentFixture<SelectCountryComponent>;

  let getAllCountriesSpy;

  beforeEach(async(() => {
    // Mock the used service:
    const programsServiceApiService = jasmine.createSpyObj('ProgramsServiceApiService', ['getCountries']);
    getAllCountriesSpy = programsServiceApiService.getCountries.and.returnValue(of(mockCountriesResponse.countries));

    TestBed.configureTestingModule({
      declarations: [SelectCountryComponent],
      imports: [
        TranslateModule.forRoot()
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ProgramsServiceApiService,
          useValue: programsServiceApiService,
        },
        {
          provide: Storage,
          useValue: MockIonicStorage,
        },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectCountryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should request all countries from the server', () => {
    expect(getAllCountriesSpy.calls.any()).toBe(true, 'getAllCountries called');
  });

});
