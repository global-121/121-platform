import { VisaCardAction } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-action.enum';
import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../auth/auth.service';
import Permission from '../../auth/permission.enum';
import { Card } from '../../models/intersolve-visa-wallet.model';
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
  public locale: string;

  @Input({ required: true })
  public programId: number;

  @Input({ required: true })
  public card: Card = {
    status: VisaCard121Status.Active,
  } as Card;

  @Input({ required: true })
  public currency: string;

  @Input({ required: true })
  public referenceId: string;

  @Input({ required: true })
  public showButtons: boolean;

  public DateFormat = DateFormat;
  public WalletCardStatus121 = VisaCard121Status;

  public isCardPaused: boolean;
  public canIssueNewCard: boolean;

  public issueLoading = false;
  public pauseLoading = false;

  constructor(
    private modalController: ModalController,
    private progamsServiceApiService: ProgramsServiceApiService,
    private alertController: AlertController,
    private translate: TranslateService,
    private errorHandlerService: ErrorHandlerService,
    private authService: AuthService,
  ) {
    this.locale = this.translate.currentLang || environment.defaultLocale;
  }

  async ngOnInit(): Promise<void> {
    this.isCardPaused = this.card.status === VisaCard121Status.Paused;
    this.canIssueNewCard = await this.getCanIssueNewCard();
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

  private async getCanIssueNewCard(): Promise<boolean> {
    return await this.authService.hasPermission(
      this.programId,
      Permission.FspDebitCardCREATE,
    );
  }

  public canUsePauseButton() {
    return this.card.status === VisaCard121Status.Paused
      ? this.canUnpause()
        ? true
        : false
      : this.canPause()
        ? true
        : false;
  }

  public checkActionsInclude(actions: VisaCardAction[]) {
    return this.card.actions.some((action) => actions.includes(action));
  }

  togglePauseButton() {
    this.pauseLoading = true;
    const block = this.card.status !== VisaCard121Status.Paused;
    this.progamsServiceApiService
      .pauseCard(this.programId, this.referenceId, this.card.tokenCode, block)
      .then(() => {
        const message = block
          ? this.translate.instant(
              'registration-details.physical-cards-overview.action-result.pause-success',
            )
          : this.translate.instant(
              'registration-details.physical-cards-overview.action-result.unpause-success',
            );

        actionResult(this.alertController, this.translate, message, true);
      })
      .catch((error) => {
        console.log('error: ', error);
        if (error && error.error) {
          const errorMessage = this.translate.instant(
            'common.error-with-message',
            {
              error: this.errorHandlerService.formatErrors(error),
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
        this.pauseLoading = false;
      });
  }

  issueNewCardButtonClick() {
    this.issueLoading = true;
    this.progamsServiceApiService
      .reissueCard(this.programId, this.referenceId)
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
