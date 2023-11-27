import { formatDate } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { DateFormat } from '../../enums/date-format.enum';

export interface DatetimeProps {
  dateFrom: string;
  dateTo: string;
}

@Component({
  selector: 'app-datetime-picker',
  templateUrl: './datetime-picker.component.html',
  styleUrls: ['./datetime-picker.component.scss'],
})
export class DatetimePickerComponent {
  @Input()
  public datetimeProps: DatetimeProps;

  public disableConfirmButton = false;
  openFromPopover = false;
  openToPopover = false;

  constructor(private modalController: ModalController) {}

  public dateFromChanged() {
    if (!this.datetimeProps.dateFrom) {
      this.datetimeProps.dateFrom = null;
      this.disableConfirmButton = false;
      return;
    }
    this.datetimeProps.dateFrom = this.datetimeProps.dateFrom.split('T')[0];
    this.compareDates();
    this.openFromPopover = false;
  }

  public dateToChanged() {
    if (!this.datetimeProps.dateTo) {
      this.datetimeProps.dateTo = null;
      this.disableConfirmButton = false;
      return;
    }
    this.datetimeProps.dateTo = this.datetimeProps.dateTo.split('T')[0];
    this.compareDates();
    this.openToPopover = false;
  }

  private compareDates() {
    this.disableConfirmButton =
      this.datetimeProps.dateTo < this.datetimeProps.dateFrom;
  }

  public getStartDate(): string {
    if (!this.datetimeProps?.dateFrom) {
      return '';
    }

    return formatDate(
      this.datetimeProps.dateFrom,
      DateFormat.dateOnlyReverse,
      environment.defaultLocale,
    );
  }

  public getEndDate(): string {
    if (!this.datetimeProps?.dateTo) {
      return '';
    }
    return formatDate(
      this.datetimeProps.dateTo,
      DateFormat.dateOnlyReverse,
      environment.defaultLocale,
    );
  }

  public submitConfirm() {
    if (!this.datetimeProps) {
      this.modalController.dismiss(null, null);
      return;
    }

    this.modalController.dismiss(this.datetimeProps, null);
  }

  public async closeModal() {
    this.modalController.dismiss(null, 'cancel');
  }
}
