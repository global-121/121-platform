import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { BannerComponent } from '../components/banner/banner.component';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { TranslatableStringService } from '../services/translatable-string.service';
import { SharedModule } from '../shared/shared.module';
import { IframeModule } from './iframe.module';
import { RecipientPage } from './recipient.page';

describe('Recipient.PageComponent', () => {
  let component: RecipientPage;
  let fixture: ComponentFixture<RecipientPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RecipientPage, BannerComponent],
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        IframeModule,
        SharedModule,
      ],
      providers: [ProgramsServiceApiService, TranslatableStringService],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipientPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
