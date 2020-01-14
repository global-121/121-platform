import { InfoPopupComponent } from '../info-popup/info-popup.component';
import { PopoverController } from '@ionic/angular';

export async function openInfoPopup(popoverController: PopoverController, message: string) {
  const popover = await popoverController.create({
    component: InfoPopupComponent,
    componentProps: {
      message
    }
  });

  return await popover.present();
}
