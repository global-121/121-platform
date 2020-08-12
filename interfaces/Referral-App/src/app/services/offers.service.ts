import { Injectable } from '@angular/core';
import apiCategoriesMock from 'src/app/mocks/api.categories.mock';
import apiOffersMock from 'src/app/mocks/api.offers.mock';
import apiSubCategoriesMock from 'src/app/mocks/api.sub-categories.mock';
import { Category } from 'src/app/models/category.model';
import { Offer } from 'src/app/models/offer.model';
import { SubCategory } from 'src/app/models/sub-category.model';

@Injectable({
  providedIn: 'root',
})
export class OffersService {
  constructor() {}

  getCategories(): Promise<Category[]> {
    return Promise.resolve(apiCategoriesMock);
  }

  getSubCategories(): Promise<SubCategory[]> {
    return Promise.resolve(apiSubCategoriesMock);
  }

  getOffers(): Promise<Offer[]> {
    return Promise.resolve(apiOffersMock);
  }
}
