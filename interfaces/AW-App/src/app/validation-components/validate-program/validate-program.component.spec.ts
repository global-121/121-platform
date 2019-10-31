import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientModule } from '@angular/common/http';

import { ValidateProgramComponent } from './validate-program.component';
import { RouterModule } from '@angular/router';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { of } from 'rxjs';
import { IonContent, IonicModule } from '@ionic/angular';


describe('ValidateProgramComponent', () => {
  let component: ValidateProgramComponent;
  let fixture: ComponentFixture<ValidateProgramComponent>;

  const storageIonicMock: any = {
    get: () => new Promise<any>((resolve) => resolve('1')),
  };

  beforeEach(async(() => {

    const programsServiceApiService = jasmine.createSpyObj('ProgramsServiceApiService', ['getPrefilledAnswers']);
    programsServiceApiService.getPrefilledAnswers.and.returnValue(of({}));


    TestBed.configureTestingModule({
      declarations: [ValidateProgramComponent],
      imports: [
        TranslateModule.forRoot(),
        RouterModule.forRoot([]),
        IonicModule.forRoot(),
        HttpClientModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ProgramsServiceApiService,
          useValue: programsServiceApiService,
        },
        {
          provide: Storage,
          useValue: storageIonicMock
        },
        IonContent,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidateProgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
