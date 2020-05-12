import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ValidateProgramComponent } from './validate-program.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { of } from 'rxjs';
import { IonContent, IonicModule } from '@ionic/angular';
import { Storage } from '@ionic/storage';

const storageIonicMock: any = {
  get: () => new Promise<any>((resolve) => resolve('1')),
};


describe('ValidateProgramComponent', () => {
  let component: ValidateProgramComponent;
  let fixture: ComponentFixture<ValidateProgramComponent>;

  beforeEach(async(() => {

    const programsServiceApiService = jasmine.createSpyObj('ProgramsServiceApiService', ['getPrefilledAnswers']);
    programsServiceApiService.getPrefilledAnswers.and.returnValue(of({}));


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
