import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
} from '@angular/core';
import { NgModel } from '@angular/forms';
import { FileChooser } from '@ionic-native/file-chooser/ngx';
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

  // public readMode = ReadMode.dataURL;
  // public picked: ReadFile | null = null;
  // public status: string | null = null;

  // @ViewChild('myFilePicker')
  // private ngxFilePicker: FilePickerDirective;

  constructor(
    public translate: TranslateService,
    private modalController: ModalController,
    private changeDetector: ChangeDetectorRef,
    private fileChooser: FileChooser,
  ) {}

  ngAfterViewInit() {
    // Required to settle the value of a dynamic property in the template:
    this.changeDetector.detectChanges();
  }

  open() {
    this.fileChooser
      .open()
      .then((uri) => console.log(uri))
      .catch((e) => console.log(e));
  }

  // ignoreTooBigFile(file: File): boolean {
  //   return file.size < 100000;
  // }

  // onReadStart(fileCount: number) {
  //   this.status = `Reading ${fileCount} file(s)...`;
  // }

  // onFilePicked(file: ReadFile) {
  //   this.picked = file;
  // }

  // onReadEnd(fileCount: number) {
  //   this.status = `Read ${fileCount} file(s) on ${new Date().toLocaleTimeString()}.`;
  //   if (this.filePicker !== null) {
  //     this.filePicker.reset();
  //   }
  // }

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
