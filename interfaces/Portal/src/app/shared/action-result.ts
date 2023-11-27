import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { PubSubEvent, PubSubService } from '../services/pub-sub.service';

export async function actionResult(
  alertController: AlertController,
  translateService: TranslateService,
  resultMessage: string,
  refresh = false,
  pubsubEvent?: PubSubEvent,
  pubsubService?: PubSubService,
) {
  const alert = await alertController.create({
    cssClass: 'alert-no-max-height',
    backdropDismiss: false,
    message: resultMessage,
    buttons: [
      {
        text: translateService.instant('common.ok'),
        handler: () => {
          alert.dismiss(true);
          if (refresh) {
            if (pubsubEvent) {
              pubsubService.publish(pubsubEvent);
            } else {
              window.location.reload();
            }
          }
          return false;
        },
      },
    ],
  });

  await alert.present();
}
