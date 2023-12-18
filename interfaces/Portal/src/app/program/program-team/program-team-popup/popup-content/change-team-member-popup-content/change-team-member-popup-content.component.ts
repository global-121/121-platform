import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Role, TeamMemberRow } from '../../../../../models/user.model';
import { ProgramsServiceApiService } from '../../../../../services/programs-service-api.service';
import { TeamMemberService } from '../../../../../services/team-member.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { WarningLabelComponent } from './../../../../../shared/warning-label/warning-label.component';

@Component({
  selector: 'app-change-team-member-popup-content',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    TranslateModule,
    FormsModule,
    ChangeTeamMemberPopupContentComponent,
    WarningLabelComponent,
  ],
  templateUrl: './change-team-member-popup-content.component.html',
  styleUrls: ['./change-team-member-popup-content.component.scss'],
})
export class ChangeTeamMemberPopupContentComponent implements OnInit {
  @Input()
  public programId: number;
  @Input()
  public teamMemberRow: TeamMemberRow;

  private userId: number;

  public scope = '';
  public searchQuery = '';

  public rolesList: Role[] = [];
  public selectedRoleNames: string[] = [];

  constructor(
    private modalController: ModalController,
    private programsServiceApiService: ProgramsServiceApiService,
    private teamMemberService: TeamMemberService,
  ) {}

  ngOnInit() {
    this.searchQuery = this.teamMemberRow.username;
    this.userId = this.teamMemberRow.id;
    this.getRoles();
    this.initiateSelectedRoleNames();
  }

  public rolesAreSelected(): boolean {
    return this.selectedRoleNames.length > 0;
  }

  public async getRoles(): Promise<void> {
    this.rolesList = await this.programsServiceApiService.getRoles();
  }

  private initiateSelectedRoleNames(): void {
    this.selectedRoleNames = this.teamMemberRow.roles.map((role) => role.role);
  }

  public isRoleSelected(roleName: string): boolean {
    if (this.teamMemberRow.roles) {
      const selected = this.teamMemberRow.roles.some(
        (role) => role.role === roleName,
      );
      return selected;
    }
    return false;
  }

  public async assignTeamMember(): Promise<void> {
    await this.programsServiceApiService.assignAidworker(
      this.programId,
      this.userId,
      this.selectedRoleNames,
      this.scope,
    );
    this.closeModal();
    this.teamMemberService.successPopup(
      'page.program-team.popup.change.succes-message',
      'page.program-team.popup.change.title',
    );
  }

  public closeModal(): void {
    this.modalController.dismiss();
  }
}
