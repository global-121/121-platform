import { DatePipe, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import {
  RegistrationActivity,
  RegistrationActivityType,
} from 'src/app/models/registration-activity.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-registration-activity-detail',
  templateUrl: './registration-activity-detail.component.html',
  styleUrls: ['./registration-activity-detail.component.css'],
  standalone: true,
  imports: [NgIf, DatePipe, IonIcon, TranslateModule],
})
export class RegistrationActivityDetailComponent {
  @Input()
  public activity: RegistrationActivity;

  @Input()
  public locale: string;

  public DateFormat = DateFormat;
  public errorCodeUrl = `${environment.twilio_error_codes_url}/`;

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
