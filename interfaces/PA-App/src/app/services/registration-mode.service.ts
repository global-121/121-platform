import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RegistrationModeService {
  public multiple = false;
  public storageKey = 'multipleMode';

  constructor() {
    this.multiple = this.getStoredMode();
  }

  public storeMode() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.multiple));
  }

  public getStoredMode() {
    const value = JSON.parse(localStorage.getItem(this.storageKey));
    return value ? true : false;
  }
}
