import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { ProgramTeamPopupOperationEnum } from '../../../models/program-team-popup-operation.enum';
import { Role, TeamMember } from '../../../models/user.model';
import { AddTeamMemberPopupContentComponent } from './popup-content/add-team-member-popup-content/add-team-member-popup-content.component';
import { ChangeTeamMemberPopupContentComponent } from './popup-content/change-team-member-popup-content/change-team-member-popup-content.component';
import { RemoveTeamMemberPopupContentComponent } from './popup-content/remove-team-member-popup-content/remove-team-member-popup-content.component';

@Component({
  selector: 'app-program-team-popup',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    TranslateModule,
    FormsModule,
    AddTeamMemberPopupContentComponent,
    RemoveTeamMemberPopupContentComponent,
    ChangeTeamMemberPopupContentComponent,
  ],
  templateUrl: './program-team-popup.component.html',
  styleUrls: ['./program-team-popup.component.scss'],
})
export class ProgramTeamPopupComponent {
  @Input()
  public operation: ProgramTeamPopupOperationEnum;

  @Input()
  public teamMemberRow: TeamMember;

  @Input()
  public title: string;

  @Input()
  enableScope: boolean;

  public programTeamPopupOperationEnum = ProgramTeamPopupOperationEnum;

  public programId: number;

  public searchQuery = '';
  public searchResults: TeamMember[][] = [];
  public showSearchResults: boolean;

  public rolesList: Role[] = [];
  public selectedRoleNames: string[] = [];

  constructor(private modalController: ModalController) {}

  public closeModal(): void {
    this.modalController.dismiss();
  }
}
