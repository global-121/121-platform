import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { SessionStorageType } from './session-storage-types.enum';

@Injectable({
  providedIn: 'root',
})
export class SessionStorageService {
  private storageSub = new Subject<string>();

  public type = SessionStorageType;

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
