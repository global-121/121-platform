import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { TeamMemberRow } from '../../../../../models/user.model';
import { ProgramsServiceApiService } from '../../../../../services/programs-service-api.service';
import { TeamMemberService } from '../../../../../services/team-member.service';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-remove-team-member-popup-content',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    TranslateModule,
    FormsModule,
    RemoveTeamMemberPopupContentComponent,
  ],
  templateUrl: './remove-team-member-popup-content.component.html',
  styleUrls: ['./remove-team-member-popup-content.component.scss'],
})
export class RemoveTeamMemberPopupContentComponent {
  @Input()
  public programId: number;

  @Input()
  public teamMemberRow: TeamMemberRow;

  constructor(
    private modalController: ModalController,
    private programsServiceApiService: ProgramsServiceApiService,
    private teamMemberService: TeamMemberService,
  ) {}

  public async removeTeamMember(): Promise<void> {
    await this.programsServiceApiService.unAssignAidworker(
      this.programId,
      this.teamMemberRow.id,
    );
    this.closeModal();
    this.teamMemberService.successPopup(
      'page.program-team.popup.remove.succes-message',
      'page.program-team.popup.remove.title',
    );
  }

  public closeModal(): void {
    this.modalController.dismiss();
  }
}
