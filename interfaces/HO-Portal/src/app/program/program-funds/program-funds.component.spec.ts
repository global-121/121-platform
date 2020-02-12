import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ProgramFunds } from 'src/app/models/program-funds.model';

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

  const fixtureProgramId = 1;
  let mockProgramsApi;
  const mockProgramFunds: ProgramFunds = {
    totalRaised: 10,
    totalTransferred: 7,
    totalAvailable: 3,
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
    testHost.programId = fixtureProgramId;
    fixture.detectChanges();

    expect(mockProgramsApi.getFundsById).toHaveBeenCalledWith(fixtureProgramId);
  });

  it('should request the funds when triggered from the interface', () => {
    testHost.programId = fixtureProgramId;
    fixture.detectChanges();

    expect(mockProgramsApi.getFundsById).toHaveBeenCalledTimes(1);

    componentElement.querySelector('ion-button').click();

    expect(mockProgramsApi.getFundsById).toHaveBeenCalledTimes(2);
    expect(mockProgramsApi.getFundsById).toHaveBeenCalledWith(fixtureProgramId);
  });
});
