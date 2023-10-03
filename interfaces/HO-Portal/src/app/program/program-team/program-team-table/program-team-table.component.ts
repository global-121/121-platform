import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
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
export class ProgramTeamTableComponent implements OnInit {
  rows: TableData[];
  DateFormat = DateFormat;

  public programId: number;

  constructor(private programsService: ProgramsServiceApiService) {}

  ngOnInit() {
    this.loadData();
  }

  public async loadData() {
    const programUsers: TableData[] =
      await this.programsService.getUsersByProgram(1); // TODO Implement programId as variable to pass in
    this.rows = programUsers;
  }
}
