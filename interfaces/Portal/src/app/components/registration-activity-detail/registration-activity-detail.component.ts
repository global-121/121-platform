import { DatePipe, JsonPipe, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonChip, IonIcon } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import {
  RegistrationActivity,
  RegistrationActivityType,
} from 'src/app/models/registration-activity.model';

@Component({
  selector: 'app-registration-activity-detail',
  templateUrl: './registration-activity-detail.component.html',
  styleUrls: ['./registration-activity-detail.component.css'],
  standalone: true,
  imports: [NgIf, DatePipe, IonIcon, IonChip, JsonPipe, TranslateModule],
})
export class RegistrationActivityDetailComponent {
  @Input()
  public activity: RegistrationActivity;

  @Input()
  public locale: string;

  public DateFormat = DateFormat;

  constructor(public translate: TranslateService) {}

  public getIconName(type: RegistrationActivityType): string {
    const map = {
      [RegistrationActivityType.message]: 'mail-outline',
      [RegistrationActivityType.changeData]: 'document-text-outline',
      [RegistrationActivityType.payment]: 'cash-outline',
      [RegistrationActivityType.status]: 'reload-circle-outline',
      [RegistrationActivityType.note]: 'clipboard-outline',
    };

    return map[type];
  }
}
