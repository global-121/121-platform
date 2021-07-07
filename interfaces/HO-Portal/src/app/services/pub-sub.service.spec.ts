import { TestBed } from '@angular/core/testing';
import { PubSubService } from './pub-sub.service';

describe('PubSubService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PubSubService = TestBed.get(PubSubService);
    expect(service).toBeTruthy();
  });
});
