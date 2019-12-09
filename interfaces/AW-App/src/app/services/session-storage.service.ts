import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {
  private storageSub = new Subject<string>();

  public type = {
    scannedData: 'scannedData',
  };


  constructor() { }

  watchStorage(): Observable<any> {
    return this.storageSub.asObservable();
  }

  async store(key: string, data: string): Promise<void> {
    window.sessionStorage[key] = data;
    this.storageSub.next(key);
  }

  async retrieve(key: string): Promise<any> {
    return window.sessionStorage[key];
  }

  async destroyItem(key: string): Promise<void> {
    window.sessionStorage.removeItem(key);
  }
}
