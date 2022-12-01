import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class IframeService {
  public savedPhoneNumber: string;

  constructor(private route: ActivatedRoute) {}

  public savePhoneNumber() {
    const snapshot = this.route.snapshot;
    this.savedPhoneNumber =
      snapshot.queryParams.phonenumber || snapshot.queryParams.phoneNumber;
  }
}
