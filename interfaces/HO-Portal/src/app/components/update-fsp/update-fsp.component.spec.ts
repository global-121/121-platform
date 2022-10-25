import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { provideMagicalMock } from '../../mocks/helpers';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { UpdateFspComponent } from './update-fsp.component';

describe('UpdateFspComponent', () => {
  let component: UpdateFspComponent;
  let fixture: ComponentFixture<UpdateFspComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [UpdateFspComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        FormsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        ProgramsServiceApiService,
        AlertController,
        TranslateService,
        provideMagicalMock(ErrorHandlerService),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateFspComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
