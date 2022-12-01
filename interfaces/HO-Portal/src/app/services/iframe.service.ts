import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IframeService implements OnDestroy {
  public savedPhoneNumber: string;
  private paramsSubscription: Subscription;
  private phoneNumberSubject = new BehaviorSubject<string | null>(null);
  public phoneNumberChange$ = this.phoneNumberSubject.asObservable();

  constructor(private activatedRoute: ActivatedRoute) {
    this.paramsSubscription = this.activatedRoute.queryParams.subscribe(
      (params: Params) => {
        if (!params.phonenumber && !params.phoneNumber) {
          return;
        }
        this.savedPhoneNumber = params.phonenumber || params.phoneNumber;
        this.phoneNumberSubject.next(this.savedPhoneNumber);
        localStorage.setItem('savedPhoneNumber', this.savedPhoneNumber);
      },
    );
  }

  ngOnDestroy(): void {
    this.paramsSubscription.unsubscribe();
  }

  getSavedPhoneNumber(): string | null {
    if (!this.savedPhoneNumber) {
      return localStorage.getItem('savedPhoneNumber');
    }
    return this.savedPhoneNumber;
  }
}
