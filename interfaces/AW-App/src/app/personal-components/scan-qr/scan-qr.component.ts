import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-scan-qr',
  templateUrl: './scan-qr.component.html',
  styleUrls: ['./scan-qr.component.scss'],
})
export class ScanQrComponent implements OnInit {

  constructor(
    public navCtrl: NavController,
    private router: Router
  ) { }

  ngOnInit() { }

  public scanQrCode() {
    this.router.navigate(['/scan-qr']);
  }

}
