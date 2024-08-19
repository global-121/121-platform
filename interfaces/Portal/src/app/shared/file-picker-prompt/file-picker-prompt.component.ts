import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { AlertController, IonInput, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ImportType } from 'src/app/models/import-type.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { actionResult } from '../../shared/action-result';

export interface FilePickerProps {
  type: string;
  explanation?: string;
  programId?: number;
  downloadTemplate?: ImportType;
  titleTranslationKey?: string;
  downloadFspInstructionsImportTemplate?: ImportType;
}

@Component({
  selector: 'app-file-picker-prompt',
  templateUrl: './file-picker-prompt.component.html',
  styleUrls: ['./file-picker-prompt.component.scss'],
})
export class FilePickerPromptComponent implements OnInit {
  @ViewChild('fileInput')
  public fileInput: IonInput;

  @Input()
  public subHeader: string;

  @Input()
  public message: string;

  @Input()
  public filePickerProps: FilePickerProps;

  public acceptFileTypes: string;

  constructor(
    public translate: TranslateService,
    private modalController: ModalController,
    private programsService: ProgramsServiceApiService,
    private alertController: AlertController,
    private errorHandlerService: ErrorHandlerService,
  ) {}

  ngOnInit() {
    if (this.filePickerProps && this.filePickerProps.type) {
      this.acceptFileTypes = this.getAcceptForType(this.filePickerProps.type);
    }
  }

  public async downloadTemplate(programId: number, type: ImportType) {
    return await this.programsService.downloadImportTemplate(programId, type);
  }

  public async downloadFspInstructionsImportTemplate(
    programId: number,
    type: ImportType,
  ) {
    try {
      return await this.programsService.downloadFspInstructionsImportTemplate(
        programId,
        type,
      );
    } catch (error) {
      console.log('error: ', error);
      actionResult(
        this.alertController,
        this.translate,
        this.translate.instant('common.error-with-message', {
          error: this.errorHandlerService.formatErrors(error),
        }),
        false,
      );
    }
  }

  private getAcceptForType(types: string): string {
    const typeList = types.split(',').map((type) => {
      switch (type.trim().toLowerCase()) {
        case 'csv':
          return '.csv,text/csv,text/comma-separated-values,application/csv';
        case 'xml':
          return '.xml,application/xml,application/xhtml+xml';
        default:
          console.warn(`Unsupported file type: ${type}`);
          return '';
      }
    });

    return typeList.filter((t) => t).join(',');
  }

  public checkOkDisabled() {
    return !this.fileInput || !this.fileInput.value;
  }

  public async submitConfirm() {
    const nativeInput = await this.fileInput.getInputElement();

    if (nativeInput && nativeInput.files && nativeInput.files.length) {
      this.modalController.dismiss(
        {
          file: nativeInput.files[0],
        },
        null,
      );
      return;
    }
  }

  public closeModal() {
    this.modalController.dismiss(null, 'cancel');
  }
}
