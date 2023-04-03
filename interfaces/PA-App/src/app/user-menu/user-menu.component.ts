import { Component, OnDestroy } from '@angular/core';
import {
  AlertController,
  LoadingController,
  ModalController,
} from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import {
  LoggingEvent,
  LoggingEventCategory,
} from 'src/app/models/logging-event.enum';
import { LoggingService } from 'src/app/services/logging.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ConversationService } from '../services/conversation.service';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
})
export class UserMenuComponent implements OnDestroy {
  public isLoggedIn = false;
  public username: string;
  private loadingDelete: HTMLIonLoadingElement;

  public isOnline = window.navigator.onLine;

  constructor(
    private modalController: ModalController,
    private paData: PaDataService,
    private translate: TranslateService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private logger: LoggingService,
    private conversationService: ConversationService,
  ) {
    this.paData.authenticationState$.subscribe((user) => {
      this.isLoggedIn = !!user;
      this.username = user && user.username ? user.username : '';
    });

    window.addEventListener('online', () => this.goOnline(), { passive: true });
    window.addEventListener('offline', () => this.goOffline(), {
      passive: true,
    });
  }

  close() {
    this.modalController.dismiss();
  }

  async logout() {
    await this.paData.logout(false);
    this.close();
    this.logger.logEvent(LoggingEventCategory.ui, LoggingEvent.logout);
    this.conversationService.restartConversation(
      this.conversationService.conversationActions.afterLogout,
    );
  }

  async deleteData() {
    if (!window.confirm('Are you sure?')) {
      return;
    }
    this.paData.deleteData().then(() => {
      this.logout();
    });
  }

  public async presentLoadingDelete() {
    this.loadingDelete = await this.loadingController.create({});
    await this.loadingDelete.present();
  }

  public async showDeleteResult(
    resultMessage: string,
    logoutOnDismiss = false,
  ) {
    const alert = await this.alertController.create({
      message: resultMessage,
      buttons: [
        {
          text: this.translate.instant('shared.close-button'),
        },
      ],
    });

    if (logoutOnDismiss) {
      alert.onDidDismiss().then(() => this.logout());
    }

    await alert.present();
  }

  public ngOnDestroy() {
    window.removeEventListener('online', () => this.goOnline());
    window.removeEventListener('offline', () => this.goOffline());
  }

  private goOnline() {
    this.isOnline = true;
  }

  private goOffline() {
    this.isOnline = false;
  }
}
