import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PaDataService } from './padata.service';
import { ProgramsServiceApiService } from './programs-service-api.service';

describe('PaDataService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ProgramsServiceApiService,
        },
      ],
    }),
  );

  it('should create', () => {
    const service: PaDataService = TestBed.inject(PaDataService);
    expect(service).toBeTruthy();
  });
});
