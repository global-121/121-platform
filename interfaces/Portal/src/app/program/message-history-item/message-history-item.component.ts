import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { Message, MessageStatusMapping } from 'src/app/models/message.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-message-history-item',
  templateUrl: './message-history-item.component.html',
  styleUrls: ['./message-history-item.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, TranslateModule],
})
export class MessageHistoryItemComponent {
  DateFormat = DateFormat;

  @Input()
  public message: Message;

  @Input()
  public lines = 'none';

  public chipStatus = MessageStatusMapping;
  public locale: string;

  constructor(public translate: TranslateService) {
    this.locale = this.translate.currentLang || environment.defaultLocale;
  }
}
