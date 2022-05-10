import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PaInclusionStates } from '../models/pa-statuses.enum';
import { PaDataService } from './padata.service';
import { ProgramsServiceApiService } from './programs-service-api.service';

@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  public updateSpeedMs = 3000;

  public pagesNav = {
    inclusion: 'tabs/personal',
  };

  constructor(
    public programsService: ProgramsServiceApiService,
    public paData: PaDataService,
    public toastController: ToastController,
    public translate: TranslateService,
    public router: Router,
  ) {}

  checkInclusionStatus(programId: number, referenceId: string) {
    return new Promise<void>((resolve) => {
      const subscription = this.listenForInclusionStatus(
        programId,
        referenceId,
      ).subscribe((isStatusAvailable) => {
        if (isStatusAvailable === PaInclusionStates.unavailable) {
          return;
        }
        subscription.unsubscribe();
        this.createUpdateToast(
          'notification.inclusion',
          this.pagesNav.inclusion,
        );
        resolve();
      });
    });
  }

  listenForInclusionStatus(programId: number, referenceId: string) {
    console.log(
      'UpdateService: listenForInclusionStatus()',
      programId,
      referenceId,
    );
    return interval(this.updateSpeedMs).pipe(
      switchMap(() =>
        this.programsService.checkInclusionStatus(referenceId, programId),
      ),
    );
  }

  createUpdateToast(messageKey: string, pageNav: string) {
    this.translate.get(messageKey).subscribe((message: string) => {
      this.toastController
        .create({
          header: message,
          animated: true,
          cssClass: 'update-toast',
          position: 'bottom',
          buttons: [
            {
              side: 'start',
              icon: 'arrow-redo',
              handler: () => {
                this.router.navigate([pageNav]);
              },
            },
            {
              side: 'end',
              role: 'cancel',
              text: this.translate.instant('shared.close-button'),
            },
          ],
        })
        .then((obj) => {
          obj.present();
        });
    });
  }
}
