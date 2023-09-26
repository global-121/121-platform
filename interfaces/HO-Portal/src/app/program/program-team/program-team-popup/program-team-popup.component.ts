import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
// import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-program-team-popup',
  standalone: true,
  imports: [CommonModule, IonicModule, SharedModule, TranslateModule],
  templateUrl: './program-team-popup.component.html',
  styleUrls: ['./program-team-popup.component.scss'],
})
export class ProgramTeamPopupComponent {
  @Input()
  public programId: number;

  constructor(private modalController: ModalController, private programsServiceApiService: ProgramsServiceApiService) {}

  searchResults: any[] = []; //TODO Should NOT be "any"

  public async search(event: CustomEvent) {
    const searchTerm = event.detail.value.toLowerCase();
    this.searchResults = await this.programsServiceApiService.getUsersByName(1, searchTerm);
  }

  public closeModal() {
    this.modalController.dismiss();
  }
}
