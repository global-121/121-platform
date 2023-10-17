import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { TeamMember } from '../../../models/user.model';
import { TeamMemberService } from '../../../services/team-member.service';

@Component({
  selector: 'app-program-team-table',
  standalone: true,
  imports: [CommonModule, IonicModule, SharedModule, TranslateModule],
  templateUrl: './program-team-table.component.html',
  styleUrls: ['./program-team-table.component.scss'],
})
export class ProgramTeamTableComponent implements OnInit {
  @Input()
  private programId: number;

  public rows: TeamMember[] = [];
  public DateFormat = DateFormat;

  constructor(
    private programsService: ProgramsServiceApiService,
    private teamMemberService: TeamMemberService,
  ) {}

  ngOnInit() {
    this.loadData();

    this.teamMemberService.teamMemberAdded$.subscribe(() => {
      this.loadData();
    });
  }

  public async loadData(): Promise<void> {
    const programUsers: TeamMember[] =
      await this.programsService.getUsersByProgram(this.programId);
    this.rows = programUsers;
  }
}
