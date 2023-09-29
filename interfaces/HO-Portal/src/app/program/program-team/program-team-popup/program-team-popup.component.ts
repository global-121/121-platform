import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, IonSearchbar } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
// import { UserRole } from 'src/app/auth/user-role.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SharedModule } from 'src/app/shared/shared.module';
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
export class ProgramTeamPopupComponent {
  programId;
  userId;
  @ViewChild('searchbar') searchbar: IonSearchbar;
  searchQuery: string = '';
  searchResults: any[] = []; //TODO Should NOT be "any"
  rolesList: any[] = []; //TODO Should NOT be "any"
  showSearchResults;

  constructor(
    private modalController: ModalController,
    // private programsService: ProgramsServiceApiService,
    private programsServiceApiService: ProgramsServiceApiService,
  ) {}

  public async search(event: CustomEvent) {
    const searchTerm = event.detail.value.toLowerCase();
    this.searchResults = await this.programsServiceApiService.getUsersByName(
      this.programId,
      searchTerm,
    );
    this.searchResults.length > 0 ? this.showSearchResults = true : this.showSearchResults = false;
  }

  updateSearchbarValue(selectedItem: string, userId: number) {
    this.searchQuery = selectedItem;
    this.userId = userId;
    this.showSearchResults = false;
  }

  public async getRoles() {
    this.rolesList = await this.programsServiceApiService.getRoles();
  }

  public async assignTeamMember() {
    await this.programsServiceApiService.assignAidworker(this.programId, this.userId, ["program-admin", "run-program"]);
    this.successPopup(event);
  }

  ngOnInit() {
    this.getRoles();
  }

  public async successPopup(e: Event) {
    event = e;
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: SuccessPopupComponent,
      componentProps: { programId: this.programId },
    });
    await modal.present();
  }

  public closeModal() {
    this.modalController.dismiss();
  }
}
