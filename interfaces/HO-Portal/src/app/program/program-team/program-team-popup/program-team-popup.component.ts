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
  searchResults: any[] = []; //TODO Should NOT be "any"
  rolesList: any[] = []; //TODO Should NOT be "any"

  constructor(
    private modalController: ModalController,
    private programsServiceApiService: ProgramsServiceApiService,
  ){}

  public async search(event: CustomEvent) {
    const searchTerm = event.detail.value.toLowerCase();
    this.searchResults = await this.programsServiceApiService.getUsersByName(this.programId, searchTerm);
  }

  updateSearchbarValue(selectedItem: string) {
    this.searchQuery = selectedItem;
  }

   public async getRoles() {
    this.rolesList = await this.programsServiceApiService.getRoles();
    console.dir(this.rolesList);
  }

  ngOnInit(){
    this.getRoles() ;
  }

  public closeModal() {
    this.modalController.dismiss();
  }
}
