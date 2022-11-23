import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { RecipientPage } from './recipient.page';

describe('Recipient.PageComponent', () => {
  let component: RecipientPage;
  let fixture: ComponentFixture<RecipientPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RecipientPage],
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule,
        TranslateModule.forRoot(),
        HttpClientTestingModule,
      ],
      providers: [ProgramsServiceApiService],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipientPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
