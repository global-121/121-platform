import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NoConnectionService {
  private noConnectionSource = new BehaviorSubject<boolean>(
    window.navigator.onLine === false,
  );
  public noConnection$ = this.noConnectionSource.asObservable();

  constructor() {
    window.addEventListener('offline', () => this.updateConnectionState());
    window.addEventListener('online', () => this.updateConnectionState());
  }

  private updateConnectionState() {
    this.noConnectionSource.next(window.navigator.onLine === false);
  }
}
