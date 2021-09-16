import { Component, Input, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ZXingScannerComponent } from '@zxing/ngx-scanner';

@Component({
  selector: 'qr-scanner',
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss'],
})
export class QrScannerComponent {
  @ViewChild('scanner', { static: false })
  scanner: ZXingScannerComponent;

  @Input()
  public debugInput: string;

  public showCompatibilityError = false;
  public showPermissionError = false;
  public showGenericError = false;

  public torchAvailable = false;
  public torchEnabled = false;

  public currentCamera: any = null;
  public switchCamerasAvailable = false;
  public camerasAvailable: any[];

  constructor(private modalController: ModalController) {}

  public onHasDevices(hasDevices: boolean) {
    this.showCompatibilityError = !hasDevices;
  }

  public onPermissionResponse(permission: boolean) {
    this.showPermissionError = !permission;
  }

  public onCamerasFound(cameras: any[]) {
    if (cameras.length > 1) {
      this.switchCamerasAvailable = true;
      this.camerasAvailable = cameras;
    }
  }

  public onCamerasNotFound() {
    this.showCompatibilityError = true;
  }

  public onScanSuccess(value: string) {
    if (value) {
      this.closeModal(value);
    }
  }

  public onScanError() {
    this.showGenericError = true;
  }

  public onTorchCompatible(available: boolean) {
    this.torchAvailable = !!available;
  }

  public switchCamera() {
    const currentCameraIndex = this.camerasAvailable.indexOf(
      this.currentCamera,
    );
    let nextCameraIndex = currentCameraIndex + 1;

    if (nextCameraIndex >= this.camerasAvailable.length) {
      nextCameraIndex = 0;
    }

    this.currentCamera = this.camerasAvailable[nextCameraIndex];
  }

  public tryAgain() {
    window.location.reload();
  }

  public closeModal(data?: string) {
    this.scanner.reset();
    this.modalController.dismiss(data);
  }
}
