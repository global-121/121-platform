import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { of } from 'rxjs';

import { ProgramsPage } from './programs.page';
import { TranslateModule } from '@ngx-translate/core';

import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import mockProgramsResponse from '../mocks/api.programs.mock';

describe('ProgramsPage', () => {
  let component: ProgramsPage;
  let fixture: ComponentFixture<ProgramsPage>;
  let programsPage: HTMLElement;

  let getAllProgramsSpy;

  beforeEach(async(() => {
    // Mock the used service:
    const programsServiceApiService = jasmine.createSpyObj('ProgramsServiceApiService', ['getAllPrograms']);
    getAllProgramsSpy = programsServiceApiService.getAllPrograms.and.returnValue(of(mockProgramsResponse.programs));

    // Configure TestBed for Component
    TestBed.configureTestingModule({
      declarations: [ProgramsPage],
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
    })
      .compileComponents();
  }));

  beforeEach(async () => {
    fixture = await TestBed.createComponent(ProgramsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should request all programs from the server', () => {
    expect(getAllProgramsSpy.calls.any()).toBe(true, 'getAllPrograms called');
  });

  it('should have a list of all programs', () => {
    programsPage = fixture.nativeElement;
    const items = programsPage.querySelectorAll('ion-item');

    expect(items.length).toEqual(mockProgramsResponse.programsCount);
  });

});
