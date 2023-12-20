import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { WalletCardStatus121 } from '../../../../../../services/121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { AuthService } from '../../auth/auth.service';
import Permission from '../../auth/permission.enum';
import { PhysicalCard } from '../../models/physical-card.model';
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
    status: WalletCardStatus121.Active,
  } as PhysicalCard;

  @Input({ required: true })
  public currency: string;

  @Input({ required: true })
  public referenceId: string;

  @Input({ required: true })
  public showButtons: boolean;

  public DateFormat = DateFormat;
  public WalletCardStatus121 = WalletCardStatus121;

  public isCardPaused: boolean;

  public issueLoading = false;
  public pauseLoading = false;

  constructor(
    private modalController: ModalController,
    private progamsServiceApiService: ProgramsServiceApiService,
    private alertController: AlertController,
    private translate: TranslateService,
    private errorHandlerService: ErrorHandlerService,
    private authService: AuthService,
  ) {}
  ngOnInit(): void {
    this.isCardPaused = this.card.status === WalletCardStatus121.Paused;
  }

  public closeModal() {
    this.modalController.dismiss();
  }

  private canPause() {
    return this.authService.hasPermission(
      this.programId,
      Permission.FspDebitCardBLOCK,
    );
  }

  private canUnpause() {
    return this.authService.hasPermission(
      this.programId,
      Permission.FspDebitCardUNBLOCK,
    );
  }

  public canIssueNewCard(): boolean {
    return this.authService.hasPermission(
      this.programId,
      Permission.FspDebitCardCREATE,
    );
  }

  public canUsePauseButton() {
    return this.card.status === WalletCardStatus121.Paused
      ? this.canUnpause()
        ? true
        : false
      : this.canPause()
        ? true
        : false;
  }

  public checkActionsInclude(actions: string[]) {
    return this.card.links.some((link) => actions.includes(link.action));
  }

  togglePauseButton() {
    this.pauseLoading = true;
    const block = this.card.status !== WalletCardStatus121.Paused;
    this.progamsServiceApiService
      .toggleBlockWallet(this.programId, this.card.tokenCode, block)
      .then((response) => {
        let message = '';
        if (response.status === 204) {
          message = block
            ? this.translate.instant(
                'registration-details.physical-cards-overview.action-result.pause-success',
              )
            : this.translate.instant(
                'registration-details.physical-cards-overview.action-result.unpause-success',
              );
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
      })
      .finally(() => {
        this.pauseLoading = false;
      });
  }

  issueNewCardButtonClick() {
    this.issueLoading = true;
    this.progamsServiceApiService
      .issueNewCard(this.programId, this.referenceId)
      .then(() => {
        actionResult(
          this.alertController,
          this.translate,
          this.translate.instant(
            'registration-details.physical-cards-overview.action-result.new-card-success',
          ),
          true,
        );
      })
      .catch((error) => {
        console.log('error: ', error);
        if (error && error.error) {
          const errorMessage = this.translate.instant(
            'registration-details.physical-cards-overview.action-result.new-card-error',
            {
              error: error.error.errors,
            },
          );
          actionResult(
            this.alertController,
            this.translate,
            errorMessage,
            true,
          );
        }
      })
      .finally(() => {
        this.issueLoading = false;
      });
  }
}
