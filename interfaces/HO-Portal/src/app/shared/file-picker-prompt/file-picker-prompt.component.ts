import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
} from '@angular/core';
import { NgModel } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

export interface FilePickerProps {
  importFile: boolean;
}

@Component({
  selector: 'file-picker-prompt',
  templateUrl: './file-picker-prompt.component.html',
  styleUrls: ['./file-picker-prompt.component.scss'],
})
export class FilePickerPromptComponent implements AfterViewInit {
  @Input()
  public subHeader: string;

  @Input()
  public message: string;

  @Input()
  public filePickerProps: FilePickerProps;
  public filePickerModel: NgModel;

  constructor(
    public translate: TranslateService,
    private modalController: ModalController,
    private changeDetector: ChangeDetectorRef,
  ) {}

  ngAfterViewInit() {
    // Required to settle the value of a dynamic property in the template:
    this.changeDetector.detectChanges();
  }

  public checkOkDisabled() {
    if (!this.filePickerProps) {
      return false;
    }

    return true;
  }

  public submitConfirm() {
    if (!this.filePickerProps) {
      this.modalController.dismiss(null, null);
      return;
    }

    this.modalController.dismiss(null, null);
  }

  public closeModal() {
    this.modalController.dismiss(null, 'cancel');
  }
}
