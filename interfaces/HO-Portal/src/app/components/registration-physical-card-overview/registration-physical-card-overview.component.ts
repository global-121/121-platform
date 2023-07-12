import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Person } from 'src/app/models/person.model';
import { PhysicalCard } from 'src/app/models/physical-card.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PhysicalCardPopupComponent } from '../physical-card-popup/physical-card-popup.component';
import { RegistrationPageTableComponent } from '../registration-page-table/registration-page-table.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    RegistrationPageTableComponent,
    PhysicalCardPopupComponent,
  ],
  selector: 'app-registration-physical-card-overview',
  templateUrl: './registration-physical-card-overview.component.html',
  styleUrls: ['./registration-physical-card-overview.component.css'],
})
export class RegistrationPhysicalCardOverviewComponent implements OnInit {
  @Input()
  private programId: number;

  @Input()
  private referenceId: Person['referenceId'];

  public physicalCards: PhysicalCard[];

  constructor(
    private programsService: ProgramsServiceApiService,
    private modalController: ModalController,
  ) {}

  public async ngOnInit() {
    this.physicalCards = await this.programsService.getPhysicalCards(
      this.programId,
      this.referenceId,
    );
  }

  public async openCardDetails(card: PhysicalCard) {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: PhysicalCardPopupComponent,
      componentProps: {
        card,
      },
    });
    await modal.present();
  }
}
