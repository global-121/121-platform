import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-program-team-popup',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    TranslateModule,
    FormsModule
  ],
  templateUrl: './program-team-popup.component.html',
  styleUrls: ['./program-team-popup.component.scss'],
})
export class ProgramTeamPopupComponent {
  programId;
  searchQuery: string = '';

  constructor(
    private modalController: ModalController,
    private programsServiceApiService: ProgramsServiceApiService,
    // private popoverController: PopoverController
  ){}

  searchResults: any[] = []; //TODO Should NOT be "any"

  public async search(event: CustomEvent) {
    const searchTerm = event.detail.value.toLowerCase();
    this.searchResults = await this.programsServiceApiService.getUsersByName(this.programId, searchTerm);
    // this.showPopoverOnSearch();
  }

  updateSearchbarValue(selectedItem: string) {
    this.searchQuery = selectedItem;
  }

  // async showPopoverOnSearch() {
  //   // Create and display the popover when a search is performed
  //   const popover = await this.popoverController.create({
  //     component: ProgramTeamPopupComponent,
  //     translucent: true,
  //   });

  //   return await popover.present();
  // }


  public closeModal() {
    this.modalController.dismiss();
  }
}
