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
  private spreadsheetKey = environment.google_sheets_api_key;
  private categorySheetName = 'Categories';
  private subCategorySheetName = 'Sub-Categories';
  private offerSheetName = 'Offers';
  private helpSheetName = 'Help';
  private spreadsheetRange = 'A2:Z';
  private helpSheetRange = 'A1:B7';

  constructor() {}

  convertCategoryRowToCategoryObject(categoryRow): Category {
    return {
      categoryID: parseInt(categoryRow[0]),
      categoryName: {
        en: categoryRow[1],
      },
      categoryIcon: categoryRow[2],
      categoryDescription: {
        en: categoryRow[3],
      },
    };
  }

  getCategories(): Promise<Category[]> {
    return fetch(
      `${this.spreadsheetURL}/${this.spreadsheetId}/values/${this.categorySheetName}!${this.spreadsheetRange}?key=${this.spreadsheetKey}`,
    )
      .then((response) => response.json())
      .then((response) => {
        return response.values.map(this.convertCategoryRowToCategoryObject);
      })
      .catch((_) => {
        return [];
      });
  }

  convertSubCategoryRowToSubCategoryObject(subCategoryRow): SubCategory {
    return {
      subCategoryID: parseInt(subCategoryRow[0]),
      subCategoryName: {
        en: subCategoryRow[1],
      },
      subCategoryIcon: subCategoryRow[2],
      subCategoryDescription: {
        en: subCategoryRow[3],
      },
      categoryID: parseInt(subCategoryRow[4]),
    };
  }

  getSubCategories(): Promise<SubCategory[]> {
    return fetch(
      `${this.spreadsheetURL}/${this.spreadsheetId}/values/${this.subCategorySheetName}!${this.spreadsheetRange}?key=${this.spreadsheetKey}`,
    )
      .then((response) => response.json())
      .then((response) => {
        return response.values.map(
          this.convertSubCategoryRowToSubCategoryObject,
        );
      })
      .catch((_) => {
        return [];
      });
  }

  convertOfferRowToOfferObject(offerRow): Offer {
    return {
      offerID: parseInt(offerRow[3]), // Offer ID
      offerName: {
        en: offerRow[5], // Name
      },
      offerIcon: offerRow[6], // Icon
      offerDescription: {
        en: offerRow[7], // What service?
      },
      offerLink: offerRow[10], // Link to Website
      offerImage: offerRow[11], // Image
      offerNumber: offerRow[8], // Phone Number
      offerEmail: offerRow[9], // Email Address
      offerAddress: offerRow[12], // Address
      offerOpeningHoursWeekdays: offerRow[13], // Opening Hours Weekdays
      offerOpeningHoursWeekends: offerRow[14], // Opening Hours Weekends
      offerForWhom: offerRow[15], // For whom?
      offerCapacity: offerRow[16], // Capacity?
      offerVisible: offerRow[4] === 'Show', // Visible?
      subCategoryID: parseInt(offerRow[1]), // Sub-Category ID
      categoryID: parseInt(offerRow[2]), // Category ID
    };
  }

  getOffers(): Promise<Offer[]> {
    return fetch(
      `${this.spreadsheetURL}/${this.spreadsheetId}/values/${this.offerSheetName}!${this.spreadsheetRange}?key=${this.spreadsheetKey}`,
    )
      .then((response) => response.json())
      .then((response) => {
        return response.values
          .map(this.convertOfferRowToOfferObject)
          .filter((offer) => offer.offerVisible);
      })
      .catch((_) => {
        return [];
      });
  }

  convertHelpRowToHelpObject(helpRow): Help {
    console.log(helpRow);
    return {
      helpIcon: helpRow[0][1],
      helpText: {
        en: helpRow[1][1],
      },
      helpPhoneLabel: {
        en: helpRow[2][1],
      },
      helpPhone: helpRow[3][1],
      helpWhatsApp: helpRow[4][1],
      helpFacebook: helpRow[5][1],
      helpTwitter: helpRow[6][1],
    };
  }

  getHelp(): Promise<Help> {
    return fetch(
      `${this.spreadsheetURL}/${this.spreadsheetId}/values/${this.helpSheetName}!${this.helpSheetRange}?key=${this.spreadsheetKey}`,
    )
      .then((response) => response.json())
      .then((response) => {
        return this.convertHelpRowToHelpObject(response.values);
      })
      .catch((_) => {
        return helpMock;
      });
  }
}
