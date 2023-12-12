import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { ProgramTeamPopupOperationEnum } from '../../../models/program-team-popup-operation.enum';
import { TeamMember, TeamMemberRow } from '../../../models/user.model';
import { TeamMemberService } from '../../../services/team-member.service';
import { ProgramTeamPopupComponent } from '../program-team-popup/program-team-popup.component';

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
  @Input()
  public canManageAidworkers: boolean;

  public rows: TeamMemberRow[] = [];
  public DateFormat = DateFormat;
  public popoverEvent: Event;

  constructor(
    private programsService: ProgramsServiceApiService,
    private teamMemberService: TeamMemberService,
    public modalController: ModalController,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.loadData();

    this.teamMemberService.teamMemberChanged$.subscribe(() => {
      this.loadData();
    });
  }

  public async loadData(): Promise<void> {
    const programUsers: TeamMember[] =
      await this.programsService.getUsersByProgram(this.programId);

    // Filter out admin-user
    let filteredProgramUsers = [];
    if (programUsers && programUsers.length > 0) {
      filteredProgramUsers = programUsers.filter((user) => !user.admin);
    }

    this.rows = filteredProgramUsers.map((user) => ({
      ...user,
      showTeamMemberPopover: false,
    }));
  }

  public toggleTeamMemberPopover(event: Event, row: TeamMemberRow): void {
    this.popoverEvent = event;
    row.showTeamMemberPopover = !row.showTeamMemberPopover;
  }

  public async editRole(row: TeamMemberRow): Promise<void> {
    row.showTeamMemberPopover = false;
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: ProgramTeamPopupComponent,
      componentProps: {
        operation: ProgramTeamPopupOperationEnum.edit,
        programId: this.programId,
        teamMemberRow: row,
        title: this.translate.instant('page.program-team.popup.change.title'),
      },
    });
    await modal.present();
  }

  public async removeFromTeam(row: TeamMemberRow): Promise<void> {
    row.showTeamMemberPopover = false;
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: ProgramTeamPopupComponent,
      componentProps: {
        operation: ProgramTeamPopupOperationEnum.remove,
        programId: this.programId,
        teamMemberRow: row,
        title: this.translate.instant('common.confirm'),
      },
    });
    await modal.present();
  }
}
