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
        en: offerRow[4], // Name
      },
      offerIcon: offerRow[5], // Icon
      offerDescription: {
        en: offerRow[6], // What service?
      },
      offerLink: offerRow[9], // Link to Website
      offerImage: offerRow[10], // Image
      offerNumber: offerRow[7], // Phone Number
      offerEmail: offerRow[8], // Email Address
      offerAddress: offerRow[11], // Address
      offerOpeningHoursWeekdays: offerRow[12], // Opening Hours Weekdays
      offerOpeningHoursWeekends: offerRow[13], // Opening Hours Weekends
      offerForWhom: offerRow[14], // For whom?
      offerCapacity: offerRow[15], // Capacity?
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
        return response.values.map(this.convertCategoryRowToOfferObject);
      })
      .catch((_) => {
        return [];
      });
  }
}
