import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { NgxFilesizeModule } from 'ngx-filesize';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';

import { RtlHelperService } from '~/services/rtl-helper.service';

@Component({
  selector: 'app-file-upload-control',
  imports: [ButtonModule, DialogModule, FileUploadModule, NgxFilesizeModule],
  templateUrl: './file-upload-control.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: FileUploadControlComponent,
      multi: true,
    },
  ],
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadControlComponent implements ControlValueAccessor {
  readonly rtlHelper = inject(RtlHelperService);
  readonly accept = input.required<string>();
  readonly clearFiles = output();

  readonly fileInputInternalModel = model<File | null>(null);
  readonly fileInputDisabled = model<boolean>(false);

  readonly fileInputFiles = computed(() => {
    const file = this.fileInputInternalModel();

    if (!file) {
      return [];
    }

    return [file];
  });

  writeValue(value: File | null) {
    this.fileInputInternalModel.set(value);
  }

  registerOnChange(fn: (value: File | null) => void) {
    this.fileInputInternalModel.subscribe(fn);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function -- Required by ControlValueAccessor, needs to be implemented but can be empty
  registerOnTouched() {}

  setDisabledState(setDisabledState: boolean) {
    this.fileInputDisabled.set(setDisabledState);
  }
}
