import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Role, TeamMember } from '../../../../../models/user.model';
import { ProgramsServiceApiService } from '../../../../../services/programs-service-api.service';
import { TeamMemberService } from '../../../../../services/team-member.service';
import { SharedModule } from '../../../../../shared/shared.module';

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
  ],
  templateUrl: './add-team-member-popup-content.component.html',
  styleUrls: ['./add-team-member-popup-content.component.scss'],
})
export class AddTeamMemberPopupContentComponent implements OnInit {
  @Input()
  public programId: number;
  private userId: number;

  public searchQuery: string = '';
  public searchResults: TeamMember[][] = [];
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
    this.searchResults = await this.programsServiceApiService.getUsersByName(
      this.programId,
      searchTerm,
    );
    this.searchResults.length > 0 && searchTerm !== ''
      ? (this.showSearchResults = true)
      : (this.showSearchResults = false);
  }

  public isFormComplete(): boolean {
    return this.searchQuery !== '' && this.selectedRoleNames.length !== 0;
  }

  public updateSearchbarValue(selectedItem: string, userId: number): void {
    this.searchQuery = selectedItem;
    this.userId = userId;
    this.showSearchResults = false;
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
