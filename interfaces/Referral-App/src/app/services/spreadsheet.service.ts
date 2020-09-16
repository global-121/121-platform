import { Injectable } from '@angular/core';
import { Category } from 'src/app/models/category.model';
import { Help } from 'src/app/models/help.model';
import { Offer } from 'src/app/models/offer.model';
import { SubCategory } from 'src/app/models/sub-category.model';
import { environment } from 'src/environments/environment';
import helpMock from '../mocks/help.mock';

@Injectable({
  providedIn: 'root',
})
export class SpreadsheetService {
  private spreadsheetURL = environment.google_sheets_api_url;
  private spreadsheetId = environment.google_sheets_sheet_id;
  private categorySheetIndex = 2;
  private subCategorySheetIndex = 3;
  private offerSheetIndex = 1;
  private helpSheetIndex = 5;

  constructor() {}

  convertCategoryRowToCategoryObject(categoryRow): Category {
    return {
      categoryID: Number(categoryRow['gsx$categoryid']['$t']),
      categoryName: {
        en: categoryRow['gsx$categoryname']['$t'],
      },
      categoryIcon: categoryRow['gsx$categoryicon']['$t'],
      categoryDescription: {
        en: categoryRow['gsx$categorydescription']['$t'],
      },
    };
  }

  getCategories(): Promise<Category[]> {
    return fetch(
      `${this.spreadsheetURL}/${this.spreadsheetId}/${this.categorySheetIndex}` +
        '/public/values?alt=json',
    )
      .then((response) => response.json())
      .then((response) => {
        return response.feed.entry.map(this.convertCategoryRowToCategoryObject);
      })
      .catch((_) => {
        return [];
      });
  }

  convertSubCategoryRowToSubCategoryObject(subCategoryRow): SubCategory {
    return {
      subCategoryID: Number(subCategoryRow['gsx$subcategoryid']['$t']),
      subCategoryName: {
        en: subCategoryRow['gsx$subcategoryname']['$t'],
      },
      subCategoryIcon: subCategoryRow['gsx$subcategoryicon']['$t'],
      subCategoryDescription: {
        en: subCategoryRow['gsx$subcategorydescription']['$t'],
      },
      categoryID: Number(subCategoryRow['gsx$categoryid']['$t']),
    };
  }

  getSubCategories(): Promise<SubCategory[]> {
    return fetch(
      `${this.spreadsheetURL}/${this.spreadsheetId}/${this.subCategorySheetIndex}` +
        '/public/values?alt=json',
    )
      .then((response) => response.json())
      .then((response) => {
        return response.feed.entry.map(
          this.convertSubCategoryRowToSubCategoryObject,
        );
      })
      .catch((_) => {
        return [];
      });
  }

  convertOfferRowToOfferObject(offerRow): Offer {
    return {
      offerID: Number(offerRow['gsx$offerid']['$t']),
      offerName: {
        en: offerRow['gsx$name']['$t'],
      },
      offerIcon: offerRow['gsx$icon']['$t'],
      offerDescription: {
        en: offerRow['gsx$whatservice']['$t'],
      },
      offerLink: offerRow['gsx$linktowebsite']['$t'],
      offerImage: offerRow['gsx$image']['$t'],
      offerNumber: offerRow['gsx$phonenumber']['$t'],
      offerEmail: offerRow['gsx$emailaddress']['$t'],
      offerAddress: offerRow['gsx$address']['$t'],
      offerOpeningHoursWeekdays: offerRow['gsx$openinghoursweekdays']['$t'],
      offerOpeningHoursWeekends: offerRow['gsx$openinghoursweekends']['$t'],
      offerForWhom: offerRow['gsx$forwhom']['$t'],
      offerCapacity: offerRow['gsx$capacity']['$t'],
      offerVisible: offerRow['gsx$visible']['$t'] === 'Show',
      subCategoryID: Number(offerRow['gsx$sub-categoryid']['$t']),
      categoryID: Number(offerRow['gsx$categoryid']['$t']),
    };
  }

  getOffers(): Promise<Offer[]> {
    return fetch(
      `${this.spreadsheetURL}/${this.spreadsheetId}/${this.offerSheetIndex}` +
        '/public/values?alt=json',
    )
      .then((response) => response.json())
      .then((response) => {
        return response.feed.entry
          .map(this.convertOfferRowToOfferObject)
          .filter((offer) => offer.offerVisible);
      })
      .catch((_) => {
        return [];
      });
  }

  convertHelpRowToHelpObject(helpRows): Help {
    return {
      helpIcon: helpRows[0]['gsx$value']['$t'],
      helpText: {
        en: helpRows[1]['gsx$value']['$t'],
      },
      helpPhoneLabel: {
        en: helpRows[2]['gsx$value']['$t'],
      },
      helpPhone: helpRows[3]['gsx$value']['$t'],
      helpWhatsApp: helpRows[4]['gsx$value']['$t'],
      helpFacebook: helpRows[5]['gsx$value']['$t'],
      helpTwitter: helpRows[6]['gsx$value']['$t'],
    };
  }

  getHelp(): Promise<Help> {
    return fetch(
      `${this.spreadsheetURL}/${this.spreadsheetId}/${this.helpSheetIndex}` +
        '/public/values?alt=json',
    )
      .then((response) => response.json())
      .then((response) => {
        return this.convertHelpRowToHelpObject(response.feed.entry);
      })
      .catch((_) => {
        return helpMock;
      });
  }
}
