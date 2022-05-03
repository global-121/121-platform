import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RegistrationModeService {
  public multiple = false;
  public storageKey = 'multipleMode';
  private batchModeSubject = new BehaviorSubject<boolean>(false);

  constructor() {
    this.multiple = this.getStoredMode();
  }

  public storeMode() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.multiple));
    this.batchModeSubject.next(this.multiple);
  }

  public getBatchMode(): Observable<boolean> {
    return this.batchModeSubject.asObservable();
  }

  public getStoredMode() {
    const value = JSON.parse(localStorage.getItem(this.storageKey));
    return value ? true : false;
  }
}
