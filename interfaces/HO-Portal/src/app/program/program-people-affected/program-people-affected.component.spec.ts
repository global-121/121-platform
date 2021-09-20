import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ProgramPeopleAffectedComponent } from './program-people-affected.component';
const modalSpy = jasmine.createSpyObj('Modal', ['present']);
const modalCtrlSpy = jasmine.createSpyObj('ModalController', ['create']);
modalCtrlSpy.create.and.callFake(() => {
  return modalSpy;
});

describe('ProgramPeopleAffectedComponent', () => {
  let component: ProgramPeopleAffectedComponent;
  let fixture: ComponentFixture<ProgramPeopleAffectedComponent>;

  const mockProgramId = 1;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramPeopleAffectedComponent],
      imports: [TranslateModule.forRoot(), FormsModule, RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideMagicalMock(AuthService),
        provideMagicalMock(ProgramsServiceApiService),
        {
          provide: ModalController,
          useValue: modalCtrlSpy,
        },
      ],
    }).compileComponents();
  }));

  let mockProgramsApi: jasmine.SpyObj<ProgramsServiceApiService>;

  beforeEach(() => {
    mockProgramsApi = TestBed.get(ProgramsServiceApiService);
    mockProgramsApi.getProgramById.and.returnValue(
      new Promise((r) => r(apiProgramsMock.programs[mockProgramId])),
    );
    mockProgramsApi.getPastInstallments.and.returnValue(
      new Promise((r) => r([])),
    );
    mockProgramsApi.getPeopleAffected.and.returnValue(
      new Promise((r) => r([])),
    );

    fixture = TestBed.createComponent(ProgramPeopleAffectedComponent);
    component = fixture.componentInstance;

    component.programId = mockProgramId;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
