import { Injectable } from '@angular/core';
import helpMock from 'src/app/mocks/help.mock';
import referralPageDataMock from 'src/app/mocks/referral-page-data.mock';
import { Category } from 'src/app/models/category.model';
import { Help } from 'src/app/models/help.model';
import { Offer } from 'src/app/models/offer.model';
import { ReferralPageData } from 'src/app/models/referral-page-data';
import { SeverityLevel } from 'src/app/models/severity-level.model';
import { SubCategory } from 'src/app/models/sub-category.model';
import { LoggingService } from 'src/app/services/logging.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SpreadsheetService {
  private spreadsheetURL = environment.google_sheets_api_url;
  private spreadsheetId = {
    amsterdam: environment.google_sheets_sheet_id_amsterdam,
    utrecht: environment.google_sheets_sheet_id_utrecht,
  };
  private categorySheetIndex = 2;
  private subCategorySheetIndex = 3;
  private offerSheetIndex = 1;
  private helpPageSheetIndex = 5;
  private referralPageSheetIndex = 6;

  constructor(public loggingService: LoggingService) {}

  static readCellValue(row, key): string {
    return row[key].$t;
  }

  convertCategoryRowToCategoryObject = (categoryRow): Category => {
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
  };

  getCategories = (region): Promise<Category[]> => {
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
  };

  convertSubCategoryRowToSubCategoryObject = (subCategoryRow): SubCategory => {
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
  };

  getSubCategories = (region): Promise<SubCategory[]> => {
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
  };

  convertOfferRowToOfferObject = (offerRow): Offer => {
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
      offerCapacity: SpreadsheetService.readCellValue(offerRow, 'gsx$capacity'),
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
  };

  getOffers = (region): Promise<Offer[]> => {
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
  };

  convertHelpRowToHelpObject = (helpRows): Help => {
    return {
      helpPageTitle: SpreadsheetService.readCellValue(helpRows[0], 'gsx$value'),
      helpIcon: SpreadsheetService.readCellValue(helpRows[1], 'gsx$value'),
      helpText: SpreadsheetService.readCellValue(helpRows[2], 'gsx$value'),
      helpPhoneLabel: SpreadsheetService.readCellValue(
        helpRows[3],
        'gsx$value',
      ),
      helpPhone: SpreadsheetService.readCellValue(helpRows[4], 'gsx$value'),
      helpWhatsApp: SpreadsheetService.readCellValue(helpRows[5], 'gsx$value'),
      helpFacebook: SpreadsheetService.readCellValue(helpRows[6], 'gsx$value'),
      helpTwitter: SpreadsheetService.readCellValue(helpRows[7], 'gsx$value'),
    };
  };

  getHelp = (region): Promise<Help> => {
    return fetch(
      `${this.spreadsheetURL}/${this.spreadsheetId[region]}/${this.helpPageSheetIndex}` +
        '/public/values?alt=json',
    )
      .then((response) => response.json())
      .then((response) => {
        return this.convertHelpRowToHelpObject(response.feed.entry);
      })
      .catch((error) => {
        if (this.loggingService) {
          this.loggingService.logException(error, SeverityLevel.Critical);
        }
        return helpMock;
      });
  };

  convertReferralPageDataRowToReferralPageDataObject = (
    referralPageDataRows,
  ): ReferralPageData => {
    return {
      referralPageTitle: SpreadsheetService.readCellValue(
        referralPageDataRows[0],
        'gsx$value',
      ),
      referralHelpButtonLabel: SpreadsheetService.readCellValue(
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
    };
  };

  getReferralPageData = (region): Promise<ReferralPageData> => {
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
        return referralPageDataMock;
      });
  };
}
