import { TestBed } from '@angular/core/testing';

import { FspConfigurationService } from './fsp-configuration.service';

describe('FspConfigurationService', () => {
  let service: FspConfigurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FspConfigurationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
