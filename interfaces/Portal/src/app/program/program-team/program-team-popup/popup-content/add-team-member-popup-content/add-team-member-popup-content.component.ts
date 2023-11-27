import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Role, UserSearchResult } from '../../../../../models/user.model';
import { ProgramsServiceApiService } from '../../../../../services/programs-service-api.service';
import { TeamMemberService } from '../../../../../services/team-member.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { WarningLabelComponent } from '../../../../../shared/warning-label/warning-label.component';

@Component({
  selector: 'app-add-team-member-popup-content',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    TranslateModule,
    FormsModule,
    AddTeamMemberPopupContentComponent,
    WarningLabelComponent,
  ],
  templateUrl: './add-team-member-popup-content.component.html',
  styleUrls: ['./add-team-member-popup-content.component.scss'],
})
export class AddTeamMemberPopupContentComponent implements OnInit {
  @Input()
  public programId: number;

  private userId: number;
  public isUserAlreadyTeamMember = false;

  public searchQuery = '';
  public searchResults: UserSearchResult[] = [];
  public showSearchResults: boolean;

  public rolesList: Role[] = [];
  public selectedRoleNames: string[] = [];

  constructor(
    private modalController: ModalController,
    private programsServiceApiService: ProgramsServiceApiService,
    private teamMemberService: TeamMemberService,
  ) {}

  ngOnInit() {
    this.getRoles();
  }

  public async search(event: CustomEvent): Promise<void> {
    const searchTerm = event.detail.value.toLowerCase();
    // Filter out admin user as it is in any program
    this.searchResults = (
      await this.programsServiceApiService.getUsersByName(
        this.programId,
        searchTerm,
      )
    ).filter((user) => user.id !== 1);

    this.searchResults.length > 0 && searchTerm !== ''
      ? (this.showSearchResults = true)
      : (this.showSearchResults = false);
  }

  public isFormComplete(): boolean {
    return (
      this.searchQuery !== '' &&
      this.selectedRoleNames.length !== 0 &&
      this.isUserAlreadyTeamMember === false
    );
  }

  public updateSearchbarValue(userSearchResult: UserSearchResult): void {
    this.searchQuery = userSearchResult.username;
    this.userId = userSearchResult.id;
    this.isUserAlreadyTeamMember = userSearchResult.assignedProgramIds.includes(
      this.programId,
    );
    this.showSearchResults = false;
  }

  public showRolesWarning(): boolean {
    return (
      this.selectedRoleNames.length === 0 &&
      !!this.userId &&
      !this.isUserAlreadyTeamMember
    );
  }

  public async getRoles(): Promise<void> {
    this.rolesList = await this.programsServiceApiService.getRoles();
  }

  public async assignTeamMember(): Promise<void> {
    await this.programsServiceApiService.assignAidworker(
      this.programId,
      this.userId,
      this.selectedRoleNames,
    );
    this.closeModal();
    this.teamMemberService.successPopup(
      'page.program-team.popup.add.succes-message',
      'page.program-team.popup.add.title',
    );
  }

  public closeModal(): void {
    this.modalController.dismiss();
  }
}
