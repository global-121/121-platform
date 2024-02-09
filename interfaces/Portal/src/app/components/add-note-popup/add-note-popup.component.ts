import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { PubSubEvent, PubSubService } from '../../services/pub-sub.service';
import { actionResult } from '../../shared/action-result';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-add-note-popup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    SharedModule,
  ],
  templateUrl: './add-note-popup.component.html',
  styleUrls: ['./add-note-popup.component.scss'],
})
export class AddNotePopupComponent {
  @Input({ required: true })
  public referenceId: string;

  @Input({ required: true })
  public programId: number;

  @Input({ required: true })
  public name: string;

  public loading = false;
  public noteText: string;

  constructor(
    private programsService: ProgramsServiceApiService,
    private modalController: ModalController,
    private translate: TranslateService,
    private alertController: AlertController,
    private pubSub: PubSubService,
    private errorHandlerService: ErrorHandlerService,
  ) {}

  async submitNote() {
    this.loading = true;
    this.programsService
      .postNote(this.programId, this.referenceId, this.noteText)
      .then(async () => {
        await actionResult(
          this.alertController,
          this.translate,
          this.translate.instant('common.save-success'),
          true,
          PubSubEvent.dataRegistrationChanged,
          this.pubSub,
        );
      })
      .catch((error) => {
        console.error('error: ', error);
        if (error && error.error) {
          const errorMessage = this.translate.instant(
            'common.error-with-message',
            {
              error: this.errorHandlerService.formatErrors(error),
            },
          );
          actionResult(this.alertController, this.translate, errorMessage);
        }
      })
      .finally(() => {
        this.loading = false;
        this.closeModal();
      });
  }

  public closeModal() {
    this.modalController.dismiss();
  }
}
