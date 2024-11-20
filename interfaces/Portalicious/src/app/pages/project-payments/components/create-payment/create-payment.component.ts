import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  ViewChild,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';

import { RegistrationsTableComponent } from '~/components/registrations-table/registrations-table.component';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-create-payment',
  standalone: true,
  imports: [
    ButtonModule,
    DialogModule,
    DatePipe,
    RegistrationsTableComponent,
    CardModule,
  ],
  templateUrl: './create-payment.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class CreatePaymentComponent {
  projectId = input.required<number>();

  toastService = inject(ToastService);

  dialogVisible = model(false);

  @ViewChild('createPaymentDialog')
  createPaymentDialog: DialogModule;
  @ViewChild('registrationsTable')
  registrationsTable: RegistrationsTableComponent;

  today = new Date();

  addSelectedToPayment() {
    this.toastService.showToast({
      severity: 'success',
      summary: 'You did it!',
      detail: 'You clicked on a button. Well done! You deserve a cookie: 🍪',
    });
  }
}
