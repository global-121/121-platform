import { Injectable } from '@angular/core';
import { Category } from 'src/app/models/category.model';
import { Offer } from 'src/app/models/offer.model';
import { ReferralPageData } from 'src/app/models/referral-page-data';
import { SeverityLevel } from 'src/app/models/severity-level.enum';
import { SubCategory } from 'src/app/models/sub-category.model';
import { LoggingService } from 'src/app/services/logging.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SpreadsheetService {
  private spreadsheetURL = environment.google_sheets_api_url;
  private spreadsheetId = {};
  private categorySheetIndex = 2;
  private subCategorySheetIndex = 3;
  private offerSheetIndex = 1;
  private referralPageSheetIndex = 5;

  constructor(public loggingService: LoggingService) {
    this.loadSheetIds();
  }

  static readCellValue(row, key): string {
    return row[key].$t.toString().trim();
  }

  loadSheetIds(): void {
    const regions: string[] = environment.regions.trim().split(/\s*,\s*/);
    const spreadsheetIds: string[] = environment.google_sheets_sheet_ids
      .trim()
      .split(/\s*,\s*/);

    regions.forEach((_, index) => {
      this.spreadsheetId[regions[index]] = spreadsheetIds[index];
    });
  }

  convertCategoryRowToCategoryObject(categoryRow): Category {
    return {
      categoryID: Number(
        SpreadsheetService.readCellValue(categoryRow, 'gsx$categoryid'),
      ),
      categoryName: SpreadsheetService.readCellValue(
        categoryRow,
        'gsx$categoryname',
      ),
      categoryIcon: SpreadsheetService.readCellValue(
        categoryRow,
        'gsx$categoryicon',
      ),
      categoryDescription: SpreadsheetService.readCellValue(
        categoryRow,
        'gsx$categorydescription',
      ),
    };
  }

  getCategories(region): Promise<Category[]> {
    return fetch(
      `${this.spreadsheetURL}/${this.spreadsheetId[region]}/${this.categorySheetIndex}` +
        '/public/values?alt=json',
    )
      .then((response) => response.json())
      .then((response) => {
        return response.feed.entry.map(this.convertCategoryRowToCategoryObject);
      })
      .catch((error) => {
        if (this.loggingService) {
          this.loggingService.logException(error, SeverityLevel.Critical);
        }
        return [];
      });
  }

  convertSubCategoryRowToSubCategoryObject(subCategoryRow): SubCategory {
    return {
      subCategoryID: Number(
        SpreadsheetService.readCellValue(subCategoryRow, 'gsx$subcategoryid'),
      ),
      subCategoryName: SpreadsheetService.readCellValue(
        subCategoryRow,
        'gsx$subcategoryname',
      ),
      subCategoryIcon: SpreadsheetService.readCellValue(
        subCategoryRow,
        'gsx$subcategoryicon',
      ),
      subCategoryDescription: SpreadsheetService.readCellValue(
        subCategoryRow,
        'gsx$subcategorydescription',
      ),
      categoryID: Number(
        SpreadsheetService.readCellValue(subCategoryRow, 'gsx$categoryid'),
      ),
    };
  }

  getSubCategories(region): Promise<SubCategory[]> {
    return fetch(
      `${this.spreadsheetURL}/${this.spreadsheetId[region]}/${this.subCategorySheetIndex}` +
        '/public/values?alt=json',
    )
      .then((response) => response.json())
      .then((response) => {
        return response.feed.entry.map(
          this.convertSubCategoryRowToSubCategoryObject,
        );
      })
      .catch((error) => {
        if (this.loggingService) {
          this.loggingService.logException(error, SeverityLevel.Critical);
        }
        return [];
      });
  }

  convertOfferRowToOfferObject(offerRow): Offer {
    return {
      offerID: Number(
        SpreadsheetService.readCellValue(offerRow, 'gsx$offerid'),
      ),
      offerName: SpreadsheetService.readCellValue(offerRow, 'gsx$name'),
      offerIcon: SpreadsheetService.readCellValue(offerRow, 'gsx$icon'),
      offerDescription: SpreadsheetService.readCellValue(
        offerRow,
        'gsx$whatservice',
      ),
      offerLink: SpreadsheetService.readCellValue(
        offerRow,
        'gsx$linktowebsite',
      ),
      offerNumber: SpreadsheetService.readCellValue(
        offerRow,
        'gsx$phonenumber',
      ),
      offerEmail: SpreadsheetService.readCellValue(
        offerRow,
        'gsx$emailaddress',
      ),
      offerAddress: SpreadsheetService.readCellValue(offerRow, 'gsx$address'),
      offerOpeningHoursWeekdays: SpreadsheetService.readCellValue(
        offerRow,
        'gsx$openinghoursweekdays',
      ),
      offerOpeningHoursWeekends: SpreadsheetService.readCellValue(
        offerRow,
        'gsx$openinghoursweekends',
      ),
      offerForWhom: SpreadsheetService.readCellValue(offerRow, 'gsx$forwhom'),
      offerWhatWillYouNeed: SpreadsheetService.readCellValue(
        offerRow,
        'gsx$whatwillyouneed',
      ),
      offerBasicRight: SpreadsheetService.readCellValue(
        offerRow,
        'gsx$basicright',
      ),
      offerVisible:
        SpreadsheetService.readCellValue(offerRow, 'gsx$visible') === 'Show',
      subCategoryID: Number(
        SpreadsheetService.readCellValue(offerRow, 'gsx$sub-categoryid'),
      ),
      categoryID: Number(
        SpreadsheetService.readCellValue(offerRow, 'gsx$categoryid'),
      ),
    };
  }

  getOffers(region): Promise<Offer[]> {
    return fetch(
      `${this.spreadsheetURL}/${this.spreadsheetId[region]}/${this.offerSheetIndex}` +
        '/public/values?alt=json',
    )
      .then((response) => response.json())
      .then((response) => {
        return response.feed.entry
          .map(this.convertOfferRowToOfferObject)
          .filter((offer) => offer.offerVisible);
      })
      .catch((error) => {
        if (this.loggingService) {
          this.loggingService.logException(error, SeverityLevel.Critical);
        }
        return [];
      });
  }

  convertReferralPageDataRowToReferralPageDataObject(
    referralPageDataRows,
  ): ReferralPageData {
    return {
      referralPageLogo: SpreadsheetService.readCellValue(
        referralPageDataRows[0],
        'gsx$value',
      ),
      referralPageTitle: SpreadsheetService.readCellValue(
        referralPageDataRows[1],
        'gsx$value',
      ),
      referralPageGreeting: SpreadsheetService.readCellValue(
        referralPageDataRows[2],
        'gsx$value',
      ),
      referralPageInstructions: SpreadsheetService.readCellValue(
        referralPageDataRows[3],
        'gsx$value',
      ),
      referralBackButtonLabel: SpreadsheetService.readCellValue(
        referralPageDataRows[4],
        'gsx$value',
      ),
      referralMainScreenButtonLabel: SpreadsheetService.readCellValue(
        referralPageDataRows[5],
        'gsx$value',
      ),
      referralPhoneNumber: SpreadsheetService.readCellValue(
        referralPageDataRows[6],
        'gsx$value',
      ),
      referralWhatsAppLink: SpreadsheetService.readCellValue(
        referralPageDataRows[7],
        'gsx$value',
      ),
    };
  }

  getReferralPageData(region): Promise<ReferralPageData> {
    return fetch(
      `${this.spreadsheetURL}/${this.spreadsheetId[region]}/${this.referralPageSheetIndex}` +
        '/public/values?alt=json',
    )
      .then((response) => response.json())
      .then((response) => {
        return this.convertReferralPageDataRowToReferralPageDataObject(
          response.feed.entry,
        );
      })
      .catch((error) => {
        if (this.loggingService) {
          this.loggingService.logException(error, SeverityLevel.Critical);
        }
        return new ReferralPageData();
      });
  }
}
