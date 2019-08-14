import { TestBed, async, inject } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UpdateService } from './update.service';

describe('UpdateService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [UpdateService]
  }));


  it('should be created', async(inject([HttpClientTestingModule, UpdateService],
    (httpClient: HttpClientTestingModule, service: UpdateService) => {
      expect(service).toBeTruthy();
    })));
});
