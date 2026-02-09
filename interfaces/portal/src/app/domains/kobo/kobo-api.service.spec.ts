import { TestBed } from '@angular/core/testing';

import { KoboApiService } from '~/domains/kobo/kobo-api.service';

describe('KoboApiService', () => {
  let service: KoboApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KoboApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
