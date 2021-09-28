import { HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { UpdateFspComponent } from './update-fsp.component';

describe('UpdateFspComponent', () => {
  let component: UpdateFspComponent;
  let fixture: ComponentFixture<UpdateFspComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UpdateFspComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [FormsModule, TranslateModule.forRoot()],
      providers: [
        ProgramsServiceApiService,
        AlertController,
        TranslateService,
        HttpClientModule,
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
