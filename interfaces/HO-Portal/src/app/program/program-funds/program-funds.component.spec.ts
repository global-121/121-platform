import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ProgramFunds } from 'src/app/models/program-funds.model';

import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { getRandomInt } from 'src/app/mocks/helpers';

import { ProgramFundsComponent } from './program-funds.component';

@Component({
  template: `<app-program-funds [programId]="programId"></app-program-funds>`,
})
class TestHostComponent {
  programId: number;
}

describe('ProgramFundsComponent (in host)', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let testHost: TestHostComponent;
  let componentElement: HTMLElement;

  const fixtureProgram = apiProgramsMock.programs[0];

  let mockProgramsApi;
  const mockProgramFunds: ProgramFunds = {
    totalRaised: getRandomInt(0, 1000),
    totalTransferred: getRandomInt(0, 1000),
    totalAvailable: getRandomInt(0, 1000),
    updated: new Date().toISOString(),
  };

  beforeEach(async(() => {
    mockProgramsApi = jasmine.createSpyObj('ProgramsServiceApiService', [
      'getFundsById',
    ]);
    mockProgramsApi.getFundsById.and.returnValue(mockProgramFunds);

    TestBed.configureTestingModule({
      declarations: [
        ProgramFundsComponent,
        TestHostComponent,
      ],
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ProgramsServiceApiService,
          useValue: mockProgramsApi,
        },
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    testHost = fixture.componentInstance;
    componentElement = fixture.nativeElement.querySelector('app-program-funds');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(testHost).toBeTruthy();
  });

  it('should NOT request the funds when no program-id is provided', () => {
    testHost.programId = undefined;
    fixture.detectChanges();

    expect(mockProgramsApi.getFundsById).not.toHaveBeenCalled();
  });

  it('should request the funds for the provided program-id', () => {
    testHost.programId = fixtureProgram.id;
    fixture.detectChanges();

    expect(mockProgramsApi.getFundsById).toHaveBeenCalledWith(fixtureProgram.id);
  });

  xit('should request the funds when triggered from the interface', () => {
    testHost.programId = fixtureProgram.id;
    fixture.detectChanges();

    expect(mockProgramsApi.getFundsById).toHaveBeenCalledTimes(1);

    componentElement.querySelector('ion-button').click();

    expect(mockProgramsApi.getFundsById).toHaveBeenCalledTimes(2);
  });
});
