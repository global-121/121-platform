import { TestBed } from '@angular/core/testing';
import { PubSubEvent, PubSubService } from './pub-sub.service';

describe('PubSubService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PubSubService = TestBed.get(PubSubService);
    expect(service).toBeTruthy();
  });

  it('should call a subscribed function, when an event is published', () => {
    const service: PubSubService = TestBed.get(PubSubService);

    const subscriber = jasmine.createSpy();
    service.subscribe(PubSubEvent.dataRegistrationChanged, subscriber);

    service.publish(PubSubEvent.dataRegistrationChanged);

    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('should call all subscribed functions, when an event is published', () => {
    const service: PubSubService = TestBed.get(PubSubService);

    const subscriber1 = jasmine.createSpy();
    const subscriber2 = jasmine.createSpy();
    service.subscribe(PubSubEvent.dataRegistrationChanged, subscriber1);
    service.subscribe(PubSubEvent.dataRegistrationChanged, subscriber2);

    service.publish(PubSubEvent.dataRegistrationChanged);

    expect(subscriber1).toHaveBeenCalledTimes(1);
    expect(subscriber2).toHaveBeenCalledTimes(1);
  });

  it('should call the subscribed function, every time an event is published', () => {
    const service: PubSubService = TestBed.get(PubSubService);

    const subscriber = jasmine.createSpy();
    service.subscribe(PubSubEvent.dataRegistrationChanged, subscriber);

    service.publish(PubSubEvent.dataRegistrationChanged);
    service.publish(PubSubEvent.dataRegistrationChanged);

    expect(subscriber).toHaveBeenCalledTimes(2);
  });

  it('should NOT call the subscribed function, when NO event is published', () => {
    const service: PubSubService = TestBed.get(PubSubService);

    const subscriber = jasmine.createSpy();
    service.subscribe(PubSubEvent.dataRegistrationChanged, subscriber);

    expect(subscriber).toHaveBeenCalledTimes(0);
  });
});
