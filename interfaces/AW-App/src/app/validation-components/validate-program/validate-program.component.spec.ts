import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { IonContent, IonicModule } from '@ionic/angular';
import { Storage } from '@ionic/storage';

import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SessionStorageService } from 'src/app/services/session-storage.service';

import { mockProgram } from 'src/app/mocks/api.program.mock';

import { ValidateProgramComponent } from './validate-program.component';

const storageIonicMock: any = {
  get: () => new Promise<any>((resolve) => resolve('1')),
};


describe('ValidateProgramComponent', () => {
  let component: ValidateProgramComponent;
  let fixture: ComponentFixture<ValidateProgramComponent>;

  beforeEach(async(() => {

    const programsServiceApiService = jasmine.createSpyObj('ProgramsServiceApiService', ['getProgramById', 'getPrefilledAnswers']);
    programsServiceApiService.getProgramById.and.returnValue(of(mockProgram).toPromise());
    programsServiceApiService.getPrefilledAnswers.and.returnValue(of({}));

    const sessionStorageService = jasmine.createSpyObj('SessionStorageService', ['type', 'retrieve', 'destroyItem']);
    sessionStorageService.type.and.returnValue({ scannedData: 'scannedData', paData: 'paData' });
    sessionStorageService.retrieve.and.returnValue(of('""').toPromise());
    sessionStorageService.destroyItem.and.returnValue(of('').toPromise());


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
          useValue: programsServiceApiService,
        },
        {
          provide: SessionStorageService,
          useValue: sessionStorageService,
        },
        {
          provide: IonContent,
          useValue: IonContent,
        },
        {
          provide: Storage,
          useValue: storageIonicMock
        }
      ]
    })
      .compileComponents();
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
