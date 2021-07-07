import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';

export const enum PubSubEvent {
  dataRegistrationChanged = 'registrationDataChanged',
}

@Injectable({
  providedIn: 'root',
})
export class PubSubService {
  private eventObservableMapping: {
    [key: string]: {
      ref: Subject<any>;
    };
  };
  constructor() {
    this.eventObservableMapping = {};
  }

  public publish(eventName: PubSubEvent, data?: any): void {
    console.log(`PubSubService: publish : ${eventName}`, data);

    this.createSubjectIfNotExist(eventName);

    this.eventObservableMapping[eventName].ref.next(data);
  }

  public subscribe(
    eventName: PubSubEvent,
    next?: (value: any) => void,
    error?: (error: any) => any,
    complete?: () => void,
  ): Subscription {
    this.createSubjectIfNotExist(eventName);

    return this.eventObservableMapping[eventName].ref.subscribe(
      next,
      error,
      complete,
    );
  }

  private createSubjectIfNotExist(eventName: string): void {
    const object = this.eventObservableMapping[eventName];
    if (object) {
      return;
    }

    this.eventObservableMapping[eventName] = {
      ref: new Subject(),
    };
  }

  private completeObservableAndDestroyMapping(eventName: string): void {
    this.eventObservableMapping[eventName].ref.complete();
    delete this.eventObservableMapping[eventName];
  }

  ngOnDestroy() {
    for (const eventName in this.eventObservableMapping) {
      if (this.eventObservableMapping.hasOwnProperty(eventName)) {
        this.completeObservableAndDestroyMapping(eventName);
      }
    }
  }
}
