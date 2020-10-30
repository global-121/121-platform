import { TestBed } from '@angular/core/testing';
import { ReferralPageDataService } from './referral-page-data.service';
import { SpreadsheetService } from './spreadsheet.service';

describe('ReferralPageDataService', () => {
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
    const service: ReferralPageDataService = TestBed.get(
      ReferralPageDataService,
    );
    expect(service).toBeTruthy();
  });
});
