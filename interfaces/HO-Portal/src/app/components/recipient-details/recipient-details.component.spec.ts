import { DatePipe } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { BannerComponent } from '../banner/banner.component';
import { RecipientDetailsComponent } from './recipient-details.component';

describe('RecipientDetailsComponent', () => {
  let component: RecipientDetailsComponent;
  let fixture: ComponentFixture<RecipientDetailsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RecipientDetailsComponent, BannerComponent],
      imports: [
        IonicModule.forRoot(),
        TranslateModule.forRoot(),
        HttpClientTestingModule,
      ],
      providers: [ProgramsServiceApiService, DatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipientDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
