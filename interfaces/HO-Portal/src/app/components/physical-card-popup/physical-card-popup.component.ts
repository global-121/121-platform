import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { AuthService } from '../../auth/auth.service';
import Permission from '../../auth/permission.enum';
import {
  PhysicalCard,
  PhysicalCardStatus,
} from '../../models/physical-card.model';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { actionResult } from '../../shared/action-result';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-physical-card-popup',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, SharedModule],
  templateUrl: './physical-card-popup.component.html',
  styleUrls: ['./physical-card-popup.component.scss'],
})
export class PhysicalCardPopupComponent implements OnInit {
  @Input({ required: true })
  public programId: number;

  @Input({ required: true })
  public card: PhysicalCard = {
    status: PhysicalCardStatus.active,
  } as PhysicalCard;

  @Input({ required: true })
  public currency: string;

  @Input({ required: true })
  public referenceId: string;

  public DateFormat = DateFormat;
  public PhysicalCardStatus = PhysicalCardStatus;

  public isCardBlocked: boolean;

  constructor(
    private modalController: ModalController,
    private progamsServiceApiService: ProgramsServiceApiService,
    private alertController: AlertController,
    private translate: TranslateService,
    private errorHandlerService: ErrorHandlerService,
    private authService: AuthService,
  ) {}
  ngOnInit(): void {
    this.isCardBlocked =
      this.card.status.toUpperCase() === PhysicalCardStatus.blocked;
  }

  public closeModal() {
    this.modalController.dismiss();
  }

  public canBlock() {
    return this.authService.hasPermission(
      this.programId,
      Permission.FspDebitCardBLOCK,
    );
  }

  public canUnblock() {
    return this.authService.hasPermission(
      this.programId,
      Permission.FspDebitCardUNBLOCK,
    );
  }

  public canUseButton() {
    return this.card.status.toUpperCase() === PhysicalCardStatus.blocked
      ? this.canUnblock()
        ? true
        : false
      : this.canBlock()
      ? true
      : false;
  }

  toggleBlockButton() {
    const block = this.card.status.toUpperCase() !== PhysicalCardStatus.blocked;
    this.progamsServiceApiService
      .toggleBlockWallet(this.programId, this.card.tokenCode, block)
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

  sendReplacementCardButtonClick() {}
}
