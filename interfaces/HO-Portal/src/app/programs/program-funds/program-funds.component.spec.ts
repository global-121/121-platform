import { CUSTOM_ELEMENTS_SCHEMA, DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ProgramFundsComponent } from './program-funds.component';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

describe('ProgramFundsComponent', () => {
  let component: ProgramFundsComponent;
  let fixture: ComponentFixture<ProgramFundsComponent>;

  const mockProgramsApi = jasmine.createSpyObj('ProgramsServiceApiService', [
    'getFundsById',
  ]);
  mockProgramsApi.getFundsById.and.returnValue('');

  const fixtureProgramId = 1;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ProgramFundsComponent,
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
    fixture = TestBed.createComponent(ProgramFundsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  xit('should NOT request the funds when no program-id is provided', () => {
    component.programId = undefined;
    fixture.detectChanges();

    expect(mockProgramsApi.getFundsById).not.toHaveBeenCalled();
  });

  xit('should request the funds for the provided program-id', () => {
    component.programId = fixtureProgramId;
    fixture.detectChanges();

    expect(mockProgramsApi.getFundsById).toHaveBeenCalledWith(fixtureProgramId);
  });

  it('should request the funds when triggered from the interface', () => {
    component.programId = fixtureProgramId;

    // Calling the public method, instead of 'clicking' the actual button
    component.update();

    expect(mockProgramsApi.getFundsById).toHaveBeenCalledTimes(1);
    expect(mockProgramsApi.getFundsById).toHaveBeenCalledWith(fixtureProgramId);
  });
});
