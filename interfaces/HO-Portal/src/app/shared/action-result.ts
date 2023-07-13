import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

export async function actionResult(
  alertController: AlertController,
  translateService: TranslateService,
  resultMessage: string,
  refresh: boolean = false,
) {
  const alert = await alertController.create({
    backdropDismiss: false,
    message: resultMessage,
    buttons: [
      {
        text: translateService.instant('common.ok'),
        handler: () => {
          alert.dismiss(true);
          if (refresh) {
            window.location.reload();
          }
          return false;
        },
      },
    ],
  });

  await alert.present();
}
