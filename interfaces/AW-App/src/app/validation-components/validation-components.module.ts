import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { ConversationService } from '../services/conversation.service';
import { QrScannerComponent } from '../shared/qr-scanner/qr-scanner.component';
import { SharedModule } from '../shared/shared.module';
import { DownloadDataComponent } from './download-data/download-data.component';
import { MainMenuComponent } from './main-menu/main-menu.component';
import { ScanQrComponent } from './scan-qr/scan-qr.component';
import { UploadDataComponent } from './upload-data/upload-data.component';
import { ValidateFspComponent } from './validate-fsp/validate-fsp.component';
import { ValidateProgramComponent } from './validate-program/validate-program.component';

@NgModule({
  declarations: [
    MainMenuComponent,
    QrScannerComponent,
    ScanQrComponent,
    ValidateProgramComponent,
    ValidateFspComponent,
    DownloadDataComponent,
    UploadDataComponent,
  ],
  imports: [CommonModule, SharedModule, FormsModule, ZXingScannerModule],
  exports: [
    MainMenuComponent,
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
