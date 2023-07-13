import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import {
  PhysicalCard,
  PhysicalCardStatus,
} from '../../models/physical-card.model';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { actionResult } from '../../shared/action-result';

@Component({
  selector: 'app-physical-card-popup',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
  templateUrl: './physical-card-popup.component.html',
  styleUrls: ['./physical-card-popup.component.scss'],
})
export class PhysicalCardPopupComponent implements OnInit {
  @Input({ required: true })
  public programId: number;

  @Input({ required: true })
  public card: PhysicalCard;

  @Input({ required: true })
  public currency: string;

  public DateFormat = DateFormat;
  public PhysicalCardStatus = PhysicalCardStatus;
  public blockButtonLabel: string;

  constructor(
    private modalController: ModalController,
    private progamsServiceApiService: ProgramsServiceApiService,
    private alertController: AlertController,
    private translate: TranslateService,
    private errorHandlerService: ErrorHandlerService,
  ) {}

  ngOnInit() {
    this.blockButtonLabel = this.getBlockButtonLabel(this.card);
  }

  private getBlockButtonLabel(card: PhysicalCard) {
    return card?.status.toUpperCase() === PhysicalCardStatus.blocked
      ? this.translate.instant(
          'registration-details.physical-cards-overview.unblock-card',
        )
      : this.translate.instant(
          'registration-details.physical-cards-overview.block-card',
        );
  }

  public closeModal() {
    this.modalController.dismiss();
  }

  toggleBlockButton(card: PhysicalCard) {
    const block = card.status.toUpperCase() !== PhysicalCardStatus.blocked;
    this.progamsServiceApiService
      .toggleBlockWallet(this.programId, card.tokenCode, block)
      .then((response) => {
        let message = '';
        if (response.status === 204) {
          message = this.translate.instant('common.update-success');
        } else if (response.status === 405) {
          message = this.translate.instant('common.update-error', {
            error: response.data?.code,
          });
        } else {
          message = this.translate.instant('common.unknown-error');
        }
        actionResult(this.alertController, this.translate, message, true);
      })
      .catch((error) => {
        console.log('error: ', error);
        if (error && error.error) {
          const errorMessage = this.translate.instant('common.update-error', {
            error: this.errorHandlerService.formatErrors(error),
          });
          actionResult(
            this.alertController,
            this.translate,
            errorMessage,
            true,
          );
        }
      });
  }

  sendReplacementCardButtonClick(card: PhysicalCard) {
    // TODO: Implement send replacement card functionality
    console.log('card: ', card);
  }
}
