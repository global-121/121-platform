import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AlertController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideMagicalMock } from '../../mocks/helpers';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { PhysicalCardPopupComponent } from './physical-card-popup.component';

describe('PhysicalCardPopupComponent', () => {
  let component: PhysicalCardPopupComponent;
  let fixture: ComponentFixture<PhysicalCardPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PhysicalCardPopupComponent,
        TranslateModule.forRoot(),
        HttpClientTestingModule,
      ],
      providers: [
        ProgramsServiceApiService,
        AlertController,
        TranslateService,
        provideMagicalMock(ErrorHandlerService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PhysicalCardPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
