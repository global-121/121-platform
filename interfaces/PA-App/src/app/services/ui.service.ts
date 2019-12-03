import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  public userMenuShown: boolean;

  private userMenuStateSource = new BehaviorSubject<boolean>(false);
  public userMenuState$ = this.userMenuStateSource.asObservable();

  constructor(
  ) { }

  public showUserMenu() {
    this.userMenuShown = true;
    this.userMenuStateSource.next(this.userMenuShown);
  }
}
