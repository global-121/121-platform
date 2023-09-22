import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { SharedModule } from 'src/app/shared/shared.module';

enum StatusName {
  active = 'active',
  inactive = 'inactive',
}

interface TableData {
  id: number;
  name: string;
  role: string;
  status: StatusName;
  lastActivity: string;
}

@Component({
  selector: 'app-program-team-table',
  standalone: true,
  imports: [CommonModule, IonicModule, SharedModule, TranslateModule],
  templateUrl: './program-team-table.component.html',
  styleUrls: ['./program-team-table.component.scss'],
})
export class ProgramTeamTableComponent {
  rows: TableData[];
  DateFormat = DateFormat;
}
