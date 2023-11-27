import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { UserRole } from 'src/app/auth/user-role.enum';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { ManageAidworkersComponent } from './manage-aidworkers.component';

describe('ManageAidworkersComponent', () => {
  let component: ManageAidworkersComponent;
  let fixture: ComponentFixture<ManageAidworkersComponent>;

  const mockProgramId = 1;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ManageAidworkersComponent],
      imports: [
        IonicModule,
        FormsModule,
        TranslateModule.forRoot(),
        SharedModule,
        NgxDatatableModule,
      ],
      providers: [provideMagicalMock(ProgramsServiceApiService)],
    }).compileComponents();
  }));

  let mockProgramsApi: jasmine.SpyObj<any>;

  beforeEach(() => {
    mockProgramsApi = TestBed.inject(ProgramsServiceApiService);
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
        username: 'aidworker@example.org',
        created: '2020-01-01T12:00:00',
        roles: [{ role: UserRole.FieldValidation }],
      },
      {
        username: 'aidworker-test2@example.org',
        created: '2020-01-01T13:00:00',
        roles: [{ role: UserRole.FieldValidation }],
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
