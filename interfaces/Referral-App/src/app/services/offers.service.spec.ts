import { TestBed } from '@angular/core/testing';
import { OffersService } from './offers.service';
import { SpreadsheetService } from './spreadsheet.service';

describe('OffersService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SpreadsheetService,
        },
      ],
    }),
  );

  it('should be created', () => {
    const service: OffersService = TestBed.get(OffersService);
    expect(service).toBeTruthy();
  });
});
