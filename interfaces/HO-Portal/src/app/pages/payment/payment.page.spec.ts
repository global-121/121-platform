import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { PaymentPage } from './payment.page';
import { AuthService } from 'src/app/auth/auth.service';
import { provideMagicalMock } from 'src/app/mocks/helpers';

describe('PaymentPage', () => {
  let component: PaymentPage;
  let fixture: ComponentFixture<PaymentPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PaymentPage],
      imports: [TranslateModule.forRoot(), RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideMagicalMock(AuthService)],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
