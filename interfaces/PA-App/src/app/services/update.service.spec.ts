import { TestBed, async, inject } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UpdateService } from './update.service';
import { TranslateModule } from '@ngx-translate/core';
import { Storage } from '@ionic/storage';
import { RouterTestingModule } from '@angular/router/testing';

describe('UpdateService', () => {

  const storageIonicMock: any = {
    get: () => new Promise<any>((resolve, reject) => resolve('1')),
  };
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, TranslateModule.forRoot(), RouterTestingModule],
    providers: [UpdateService, {
      provide: Storage,
      useValue: storageIonicMock
    }]
  }));


  it('should be created', async(inject([HttpClientTestingModule, UpdateService],
    (httpClient: HttpClientTestingModule, service: UpdateService) => {
      expect(service).toBeTruthy();
    })));
});
