import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ManageAidworkersComponent } from './manage-aidworkers.component';

describe('ManageAidworkersComponent', () => {
  let component: ManageAidworkersComponent;
  let fixture: ComponentFixture<ManageAidworkersComponent>;

  const mockProgramId = 1;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ManageAidworkersComponent],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideMagicalMock(ProgramsServiceApiService)],
    }).compileComponents();
  }));

  let mockProgramsApi: jasmine.SpyObj<ProgramsServiceApiService>;

  beforeEach(() => {
    mockProgramsApi = TestBed.get(ProgramsServiceApiService);
    mockProgramsApi.getProgramById.and.returnValue(
      new Promise((r) => r(apiProgramsMock.programs[mockProgramId])),
    );

    fixture = TestBed.createComponent(ManageAidworkersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should list all aidworkers if available', async () => {
    const programWithAidworkers = apiProgramsMock.programs[mockProgramId];
    programWithAidworkers.aidworkerAssignments = [
      {
        email: 'aidworker@example.org',
        created: '2020-01-01T12:00:00',
      },
      {
        email: 'aidworker-test2@example.org',
        created: '2020-01-01T13:00:00',
      },
    ];
    mockProgramsApi.getProgramById.and.returnValue(
      new Promise((r) => r(programWithAidworkers)),
    );

    fixture.detectChanges();
    await fixture.isStable();

    expect(component.aidworkers.length).toEqual(
      programWithAidworkers.aidworkerAssignments.length,
    );
  });

  it('should list no aidworkers when none available', () => {
    expect(component.aidworkers).toBeFalsy();
  });
});
