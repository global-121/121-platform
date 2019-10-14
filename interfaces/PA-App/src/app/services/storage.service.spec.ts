import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { Storage } from '@ionic/storage';
import { MockIonicStorage } from '../mocks/ionic.storage.mock';

import { PaDataService } from './storage.service';

describe('PaDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      HttpClientTestingModule,
    ],
    providers: [
      {
        provide: Storage,
        useValue: MockIonicStorage,
      },
    ],
  }));

  it('should create', () => {
    const service: PaDataService = TestBed.get(PaDataService);
    expect(service).toBeTruthy();
  });
});
