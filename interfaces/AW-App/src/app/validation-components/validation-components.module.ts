import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';

import { ConversationService } from '../services/conversation.service';
import { MainMenuComponent } from './main-menu/main-menu.component';
import { ViewAppointmentsComponent } from './view-appointments/view-appointments.component';
import { ScanQrComponent } from './scan-qr/scan-qr.component';
import { ValidateProgramComponent } from './validate-program/validate-program.component';
import { DownloadDataComponent } from './download-data/download-data.component';
import { UploadDataComponent } from './upload-data/upload-data.component';
import { ValidateFspComponent } from './validate-fsp/validate-fsp.component';
import { QrScannerComponent } from '../shared/qr-scanner/qr-scanner.component';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

@NgModule({
  declarations: [
    MainMenuComponent,
    ViewAppointmentsComponent,
    QrScannerComponent,
    ScanQrComponent,
    ValidateProgramComponent,
    ValidateFspComponent,
    DownloadDataComponent,
    UploadDataComponent,
  ],
  imports: [CommonModule, SharedModule, FormsModule, ZXingScannerModule],
  entryComponents: [
    MainMenuComponent,
    ViewAppointmentsComponent,
    ScanQrComponent,
    QrScannerComponent,
    ValidateProgramComponent,
    ValidateFspComponent,
    DownloadDataComponent,
    UploadDataComponent,
  ],
  exports: [
    MainMenuComponent,
    ViewAppointmentsComponent,
    ScanQrComponent,
    QrScannerComponent,
    ValidateProgramComponent,
    ValidateFspComponent,
    DownloadDataComponent,
    UploadDataComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [ConversationService],
})
export class ValidationComponentsModule {}
