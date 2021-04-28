import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonContent, IonicModule } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { mockProgram } from 'src/app/mocks/api.program.mock';
import { IonicStorageTypes } from 'src/app/services/iconic-storage-types.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ValidateProgramComponent } from './validate-program.component';

describe('ValidateProgramComponent', () => {
  let component: ValidateProgramComponent;
  let fixture: ComponentFixture<ValidateProgramComponent>;

  beforeEach(async(() => {
    const programsServiceApiServiceMock = jasmine.createSpyObj(
      'ProgramsServiceApiService',
      {
        getProgramById: () => of(mockProgram).toPromise(),
        getPrefilledAnswers: () => of({}).toPromise(),
      },
    );

    const ionContentMock = jasmine.createSpyObj('IonContent', [
      'scrollToBottom',
    ]);

    const ionicStorageMock = {
      get: (type: IonicStorageTypes) =>
        new Promise<any>((resolve) => {
          switch (type) {
            case IonicStorageTypes.myPrograms:
              return resolve([mockProgram]);
            default:
              return resolve('1');
          }
        }),
    };

    TestBed.configureTestingModule({
      declarations: [ValidateProgramComponent],
      imports: [
        TranslateModule.forRoot(),
        IonicModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ProgramsServiceApiService,
          useValue: programsServiceApiServiceMock,
        },
        {
          provide: IonContent,
          useValue: ionContentMock,
        },
        {
          provide: Storage,
          useValue: ionicStorageMock,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidateProgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
