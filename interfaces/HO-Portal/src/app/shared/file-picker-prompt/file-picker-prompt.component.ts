import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { IonInput, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ImportType } from 'src/app/models/import-type.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

export interface FilePickerProps {
  type: 'csv' | 'xml';
  explanation?: string;
  programId?: number;
  downloadTemplate?: ImportType;
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
  ) {}

  ngOnInit() {
    if (this.filePickerProps && this.filePickerProps.type) {
      this.acceptFileTypes = this.getAcceptForType(this.filePickerProps.type);
    }
  }

  public async downloadTemplate(programId: number, type: ImportType) {
    return await this.programsService.downloadImportTemplate(programId, type);
  }

  private getAcceptForType(type: FilePickerProps['type']): string {
    if (type === 'csv') {
      return '.csv,text/csv,text/comma-separated-values,application/csv';
    }
    if (type === 'xml') {
      return '.xml,application/xml,application/xhtml+xml,';
    }
    return '';
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
