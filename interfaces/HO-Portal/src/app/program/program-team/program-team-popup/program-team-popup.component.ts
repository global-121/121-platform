import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
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
  searchQuery: string = '';
  searchResults: any[] = []; //TODO Should NOT be "any"
  rolesList: any[] = []; //TODO Should NOT be "any"

  constructor(
    private modalController: ModalController,
    private programsServiceApiService: ProgramsServiceApiService, // private popoverController: PopoverController
  ) {}

  public async search(event: CustomEvent) {
    const searchTerm = event.detail.value.toLowerCase();
    this.searchResults = await this.programsServiceApiService.getUsersByName(
      this.programId,
      searchTerm,
    );
    // this.showPopoverOnSearch();
  }

  updateSearchbarValue(selectedItem: string) {
    this.searchQuery = selectedItem;
  }

  public async getRoles() {
    this.rolesList = await this.programsServiceApiService.getRoles();
    console.dir(this.rolesList);
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
