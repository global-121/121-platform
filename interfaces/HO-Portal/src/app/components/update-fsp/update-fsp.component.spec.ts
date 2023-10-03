import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule } from '@ionic/angular';
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
      imports: [
        IonicModule,
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
