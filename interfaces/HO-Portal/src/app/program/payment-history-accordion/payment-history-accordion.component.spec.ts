import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { PaymentHistoryAccordionComponent } from './payment-history-accordion.component';

describe('PaymentHistoryaccordionComponent', () => {
  let component: PaymentHistoryAccordionComponent;
  let fixture: ComponentFixture<PaymentHistoryAccordionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule, FormsModule, SharedModule, CommonModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentHistoryAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
