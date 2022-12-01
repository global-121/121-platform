import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class IframeService {
  private _savedPhoneNumber: string;
  public get savedPhoneNumber(): string {
    return this._savedPhoneNumber;
  }
  public set savedPhoneNumber(value: string) {
    this._savedPhoneNumber = value;
  }

  constructor(private route: ActivatedRoute) {}

  public savePhoneNumber() {
    const snapshot = this.route.snapshot;
    this.savedPhoneNumber =
      snapshot.queryParams.phonenumber || snapshot.queryParams.phoneNumber;
  }
}
