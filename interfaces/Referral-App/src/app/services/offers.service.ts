import { Injectable } from '@angular/core';
import { Category } from 'src/app/models/category.model';
import { Offer } from 'src/app/models/offer.model';
import { SubCategory } from 'src/app/models/sub-category.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OffersService {
  private spreadsheetURL = environment.google_sheets_api_url;
  private spreadsheetId = environment.google_sheets_sheet_id;
  private spreadsheetKey = environment.google_sheets_api_key;
  private categorySheetName = 'Categories';
  private subCategorySheetName = 'Sub-Categories';
  private offerSheetName = 'Offers';
  private spreadsheetRange = 'A2:Z';

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

  convertCategoryRowToSubCategoryObject(subCategoryRow): SubCategory {
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
        return response.values.map(this.convertCategoryRowToSubCategoryObject);
      })
      .catch((_) => {
        return [];
      });
  }

  convertCategoryRowToOfferObject(offerRow): Offer {
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
          .map(this.convertCategoryRowToOfferObject)
          .filter((offer) => offer.offerVisible);
      })
      .catch((_) => {
        return [];
      });
  }
}
