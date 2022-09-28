import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ProgramDetailsComponent } from './program-details.component';

const modalSpy = jasmine.createSpyObj('Modal', ['present']);
const modalCtrlSpy = jasmine.createSpyObj('ModalController', ['create']);
modalCtrlSpy.create.and.callFake(() => {
  return modalSpy;
});

describe('ProgramDetailsComponent', () => {
  let component: ProgramDetailsComponent;
  let fixture: ComponentFixture<ProgramDetailsComponent>;

  const mockProgramId = 1;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ProgramDetailsComponent],
        imports: [TranslateModule.forRoot()],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        providers: [
          {
            provide: ModalController,
            useValue: modalCtrlSpy,
          },
          provideMagicalMock(ProgramsServiceApiService),
        ],
      }).compileComponents();
    }),
  );

  let mockProgramsApi: jasmine.SpyObj<any>;

  beforeEach(() => {
    mockProgramsApi = TestBed.inject(ProgramsServiceApiService);
    mockProgramsApi.getProgramById.and.returnValue(
      new Promise((r) => r(apiProgramsMock.programs[mockProgramId])),
    );

    fixture = TestBed.createComponent(ProgramDetailsComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
