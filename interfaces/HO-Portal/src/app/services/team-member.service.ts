import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { SuccessPopupComponent } from '../program/program-team/success-popup/success-popup.component';

@Injectable({
  providedIn: 'root',
})
export class TeamMemberService {
  constructor(
    private modalController: ModalController,
    private translate: TranslateService,
  ) {}

  private teamMemberChangedSource = new Subject<void>();

  public teamMemberChanged$ = this.teamMemberChangedSource.asObservable();

  public notifyTeamMemberChanged(): void {
    this.teamMemberChangedSource.next();
  }

  public async successPopup(
    messageProp: string,
    titleProp: string,
  ): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: SuccessPopupComponent,
      componentProps: {
        message: this.translate.instant(messageProp),
        title: this.translate.instant(titleProp),
      },
    });
    await modal.present();
    this.notifyTeamMemberChanged();
    window.setTimeout(() => {
      modal.dismiss();
    }, 3000);
  }
}
