import { SessionStorageService } from './../services/session-storage.service';
import { Component, OnInit } from '@angular/core';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner/ngx';
import { NavController, LoadingController, AlertController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import { ConversationService } from '../services/conversation.service';

@Component({
  selector: 'app-scan-qr',
  templateUrl: './scan-qr.page.html',
  styleUrls: ['./scan-qr.page.scss'],
})
export class ScanQrPage implements OnInit {

  private isBackMode = true;
  private isFlashLightOn = false;
  private scanSub: any;
  loader: any;
  isValidationMeeting = false;

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public qrScanner: QRScanner,
    public storage: Storage,
    public toastCtrl: ToastController,
    public loadingCtrl: LoadingController,
    public alertCtrl: AlertController,
    public router: Router,
    public conversationService: ConversationService,
    public sessionStorageService: SessionStorageService
  ) {

  }

  async ionViewWillEnter() {
    this.loader = await this.loadingCtrl.create({
      message: 'Please wait...'
    });
    this.loader.present();

    setTimeout(() => {
      this.getOrigins();
    }, 200);

    // Optionally request the permission early
    this.qrScanner.prepare()
      .then((status: QRScannerStatus) => {
        this.loader.dismiss();
        if (status.authorized) {
          // camera permission was granted
          console.log('Camera Permission Given');

          // start scanning
          this.scanSub = this.qrScanner.scan().subscribe((text: any) => {
            console.log('camera text', text);
            this.qrScanner.hide(); // hide camera preview
            this.scanSub.unsubscribe(); // stop scanning
            this.startMeeting(text);
          });

          // show camera preview
          this.qrScanner.show();

          // wait for user to scan something, then the observable callback will be called
        } else if (status.denied) {
          // camera permission was permanently denied
          // you must use QRScanner.openSettings() method to guide the user to the settings page
          // then they can grant the permission from there
          console.log('Camera permission denied');
        } else {
          // permission was denied, but not permanently. You can ask for permission again at a later time.
          console.log('Permission denied for this runtime.');
        }
      })
      .catch((e: any) => {
        console.log('Error is', e);
        this.loader.dismiss();
      });
  }

  closeModal() {
    this.router.navigate(['/tabs/validation']);
    this.qrScanner.hide(); // hide camera preview
    this.scanSub.unsubscribe(); // stop scanning
  }
  getOrigins() {
    this.isValidationMeeting = true;
  }

  toggleFlashLight() {
    this.isFlashLightOn = !this.isFlashLightOn;
    if (this.isFlashLightOn) {
      this.qrScanner.enableLight();
    } else {
      this.qrScanner.disableLight();
    }
  }
  toggleCamera() {
    this.isBackMode = !this.isBackMode;
    if (this.isBackMode) {
      this.qrScanner.useFrontCamera();
    } else {
      this.qrScanner.useBackCamera();
    }
  }

  startMeeting(qr) {
    this.sessionStorageService.store(this.sessionStorageService.type.scannedDid, qr);

    this.router.navigate(['/tabs/validation']);
  }

  ngOnInit() {
  }

}
