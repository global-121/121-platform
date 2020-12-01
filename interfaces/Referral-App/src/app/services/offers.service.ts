import { Injectable } from '@angular/core';
import { Category } from 'src/app/models/category.model';
import { Offer } from 'src/app/models/offer.model';
import { SubCategory } from 'src/app/models/sub-category.model';
import { SpreadsheetService } from './spreadsheet.service';

@Injectable({
  providedIn: 'root',
})
export class OffersService {
  constructor(private spreadsheetService: SpreadsheetService) {}

  getCategories(region): Promise<Category[]> {
    return this.spreadsheetService.getCategories(region);
  }

  getSubCategories(region): Promise<SubCategory[]> {
    return this.spreadsheetService.getSubCategories(region);
  }

  getOffers(region): Promise<Offer[]> {
    return this.spreadsheetService.getOffers(region);
  }
}
