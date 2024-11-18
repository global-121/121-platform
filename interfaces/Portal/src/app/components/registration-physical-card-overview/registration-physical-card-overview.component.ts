import { WalletCardStatus121 } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
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
  styleUrls: ['./registration-physical-card-overview.component.scss'],
})
export class RegistrationPhysicalCardOverviewComponent implements OnInit {
  @Input()
  private programId: number;

  @Input()
  private referenceId: Person['referenceId'];

  @Input()
  public currency: string;

  @Input()
  public nrPayments: Person['paymentCount'];

  @Input()
  public registrationStatus: Person['status'];

  public physicalCards: PhysicalCard[];
  public WalletCardStatus121 = WalletCardStatus121;
  public latestCard: PhysicalCard;

  public loading = true;

  constructor(
    private programsService: ProgramsServiceApiService,
    private modalController: ModalController,
  ) {}

  public async ngOnInit() {
    if (!this.nrPayments || Number(this.nrPayments) === 0) {
      this.loading = false;
      return;
    }

    try {
      this.physicalCards = await this.programsService.getPhysicalCards(
        this.programId,
        this.referenceId,
      );
    } catch (error) {
      this.physicalCards = [];
    }

    this.physicalCards.sort((a, b) => {
      if (a.issuedDate < b.issuedDate) {
        return 1;
      }

      if (a.issuedDate > b.issuedDate) {
        return -1;
      }

      return 0;
    });

    this.latestCard = this.physicalCards[0];

    this.loading = false;
  }

  public async openCardDetails(card: PhysicalCard) {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: PhysicalCardPopupComponent,
      componentProps: {
        card,
        currency: this.currency,
        programId: this.programId,
        referenceId: this.referenceId,
        showButtons: this.latestCard.tokenCode === card.tokenCode,
      },
    });
    await modal.present();
  }

  public showPhysicalCardOverview(): boolean {
    return this.physicalCards?.length > 0;
  }
}
