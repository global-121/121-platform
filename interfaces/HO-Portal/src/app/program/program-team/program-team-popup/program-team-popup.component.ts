import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { Role, TeamMember } from '../../../models/user.model';
import { SuccessPopupComponent } from '../success-popup/success-popup.component';

@Component({
  selector: 'app-program-team-popup',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    TranslateModule,
    FormsModule,
  ],
  templateUrl: './program-team-popup.component.html',
  styleUrls: ['./program-team-popup.component.scss'],
})
export class ProgramTeamPopupComponent implements OnInit {
  private programId: number;
  private userId: number;

  public searchQuery: string = '';
  public searchResults: TeamMember[][] = [];
  public showSearchResults: boolean;

  public rolesList: Role[] = [];
  public selectedRoleNames: string[] = [];

  constructor(
    private modalController: ModalController,
    private programsServiceApiService: ProgramsServiceApiService,
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
    this.successPopup();
  }

  public async successPopup(): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: SuccessPopupComponent,
      componentProps: { programId: this.programId },
    });
    await modal.present();
    window.setTimeout(() => {
      modal.dismiss();
    }, 3000);
  }

  public closeModal(): void {
    this.modalController.dismiss();
  }
}
