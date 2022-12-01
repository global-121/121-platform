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
        localStorage.setItem('savedPhoneNumber', this.savedPhoneNumber);
        this.phoneNumberSubject.next(this.savedPhoneNumber);
      },
    );
  }

  ngOnDestroy(): void {
    this.paramsSubscription.unsubscribe();
  }

  getSavedPhoneNumber(): string | null {
    const snapshotParams = this.activatedRoute.snapshot.queryParams;
    const phoneNumber =
      snapshotParams.phonenumber ||
      snapshotParams.phoneNumber ||
      this.savedPhoneNumber ||
      localStorage.getItem('savedPhoneNumber');
    return phoneNumber;
  }

  public getIsIframe(): boolean {
    return window !== window.parent;
  }
}
