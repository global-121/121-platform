import { Injectable } from '@angular/core';
import { Category } from 'src/app/models/category.model';
import { Offer } from 'src/app/models/offer.model';
import { SubCategory } from 'src/app/models/sub-category.model';

@Injectable({
  providedIn: 'root',
})
export class OffersService {
  private spreadsheetURL = 'https://sheets.googleapis.com/v4/spreadsheets';
  private spreadsheetId = '1OANMuGJxGBQ2ba3xVfKvTpD0EGQM-ukUrgRyN9tzMbQ';
  private spreadsheetKey = 'AIzaSyCJW0xxT4kgdUIzVGBVu3X39QxYrYBLzdY';
  private categorySheetName = 'Categories';
  private subCategorySheetName = 'Sub-Categories';
  private offerSheetName = 'Offers';
  private spreadsheetRange = 'A2:H';

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
      });
  }

  convertCategoryRowToOfferObject(offerRow): Offer {
    return {
      offerID: parseInt(offerRow[0]),
      offerName: {
        en: offerRow[1],
      },
      offerIcon: offerRow[2],
      offerDescription: {
        en: offerRow[3],
      },
      offerLink: offerRow[4],
      offerImage: offerRow[5],
      subCategoryID: parseInt(offerRow[6]),
      categoryID: parseInt(offerRow[7]),
    };
  }

  getOffers(): Promise<Offer[]> {
    return fetch(
      `${this.spreadsheetURL}/${this.spreadsheetId}/values/${this.offerSheetName}!${this.spreadsheetRange}?key=${this.spreadsheetKey}`,
    )
      .then((response) => response.json())
      .then((response) => {
        return response.values.map(this.convertCategoryRowToOfferObject);
      });
  }
}
