import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { RegistrationDetailsPage } from './registration-details.page';

describe('RegistrationDetailsPage', () => {
  let component: RegistrationDetailsPage;
  let fixture: ComponentFixture<RegistrationDetailsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistrationDetailsPage],
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        SharedModule,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrationDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
