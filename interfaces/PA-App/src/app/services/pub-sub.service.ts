import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';

export const enum PubSubEvent {
  test = 'test',
  didAddSyncTask = 'didAddSyncTask',
  didCompleteSyncQueue = 'didCompleteSyncQueue',
  didConnectionOffline = 'didConnectionOffline',
  didConnectionOnline = 'didConnectionOnline',
  didSaveAnswerToServer = 'didSaveAnswerToServer',
}

@Injectable({
  providedIn: 'root',
})
export class PubSubService implements OnDestroy {
  private eventMap: Map<PubSubEvent | string, Subject<any>> = new Map();

  constructor() {}

  public ngOnDestroy() {
    this.eventMap.forEach((_value, key) => {
      this.completeObservableAndDestroyMapping(key);
    });
  }

  public publish(eventName: PubSubEvent | string, data?: any): void {
    console.log(`PubSubService: publish : ${eventName}`, data);

    this.createSubjectIfNotExist(eventName);

    this.eventMap.get(eventName).next(data);
  }

  public subscribe(
    eventName: PubSubEvent | string,
    next?: (value: any) => void,
    error?: (error: any) => any,
    complete?: () => void,
  ): Subscription {
    this.createSubjectIfNotExist(eventName);

    return this.eventMap.get(eventName).subscribe(next, error, complete);
  }

  private createSubjectIfNotExist(eventName: PubSubEvent | string): void {
    if (this.eventMap.has(eventName)) {
      return;
    }

    this.eventMap.set(eventName, new Subject());
  }

  private completeObservableAndDestroyMapping(
    eventName: PubSubEvent | string,
  ): void {
    this.eventMap.get(eventName).complete();
    this.eventMap.delete(eventName);
  }
}
