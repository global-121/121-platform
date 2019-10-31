import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { Storage } from '@ionic/storage';
import { MockIonicStorage } from '../mocks/ionic.storage.mock';

import { UpdateService } from './update.service';

describe('UpdateService', () => {

  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      HttpClientTestingModule,
      RouterTestingModule,
      TranslateModule.forRoot(),
    ],
    providers: [
      UpdateService,
      {
        provide: Storage,
        useValue: MockIonicStorage,
      },
    ],
  }));

  it('should create', () => {
    const service: UpdateService = TestBed.get(UpdateService);
    expect(service).toBeTruthy();
  });
});
