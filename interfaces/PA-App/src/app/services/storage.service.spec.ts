import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { Storage } from '@ionic/storage';
import { MockIonicStorage } from '../mocks/ionic.storage.mock';

import { StorageService } from './storage.service';

describe('StorageService', () => {
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
    const service: StorageService = TestBed.get(StorageService);
    expect(service).toBeTruthy();
  });
});
