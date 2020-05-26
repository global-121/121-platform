import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SessionStorageService {
  private storageSub = new Subject<string>();

  public type = {
    scannedData: 'scannedData',
    paData: 'paData',
  };

  constructor() {}

  watchStorage(): Observable<any> {
    return this.storageSub.asObservable();
  }

  store(key: string, data: string) {
    window.sessionStorage[key] = data;
    this.storageSub.next(key);
  }

  async retrieve(key: string): Promise<string> {
    return window.sessionStorage[key];
  }

  destroyItem(key: string) {
    window.sessionStorage.removeItem(key);
  }
}
