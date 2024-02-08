import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
// TODO: remove unused imports
//import { IonicModule, ModalController } from '@ionic/angular';
//import { TranslateModule, TranslateService } from '@ngx-translate/core';
// TODO: fix absolute vs relative paths
import { TranslateModule } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { Message, MessageStatusMapping } from 'src/app/models/message.model';
import { Person } from '../../models/person.model';
import { Program } from '../../models/program.model';

// TODO: check and test translations and locale formatting of this component
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
  public person: Person;

  @Input()
  public program: Program;

  public chipStatus = MessageStatusMapping;

  constructor() {}
}
