import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { Card, Wallet } from 'src/app/models/intersolve-visa-wallet.model';
import { Person } from 'src/app/models/person.model';
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

  public wallet: Wallet;
  public WalletCardStatus121 = VisaCard121Status;
  public latestCard: Card;

  public DateFormat = DateFormat;

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
      this.wallet = await this.programsService.getUpdateWalletAndCards(
        this.programId,
        this.referenceId,
      );
    } catch (error) {
      this.wallet = null;
    }

    this.wallet.cards.sort((a, b) => {
      if (a.issuedDate < b.issuedDate) {
        return 1;
      }

      if (a.issuedDate > b.issuedDate) {
        return -1;
      }

      return 0;
    });

    this.latestCard = this.wallet.cards[0];

    this.loading = false;
  }

  public async openCardDetails(card: Card) {
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
    return this.wallet?.cards?.length > 0;
  }
}
