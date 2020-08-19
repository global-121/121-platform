import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Category } from 'src/app/models/category.model';
import { Offer } from 'src/app/models/offer.model';
import { SubCategory } from 'src/app/models/sub-category.model';
import { OffersService } from 'src/app/services/offers.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';

@Component({
  selector: 'app-referral',
  templateUrl: 'referral.page.html',
  styleUrls: ['referral.page.scss'],
})
export class ReferralPage {
  public offers: Offer[];
  public categories: Category[];
  public subCategories: SubCategory[];

  public category: Category;
  public subCategory: SubCategory;
  public offer: Offer;

  constructor(
    public offersService: OffersService,
    private route: ActivatedRoute,
    private router: Router,
    public translatableString: TranslatableStringService,
  ) {
    this.loadReferralData();
  }

  private loadReferralData() {
    this.offersService.getCategories().then((categories) => {
      this.categories = this.translateCategories(categories);
      this.offersService.getSubCategories().then((subCategories) => {
        this.subCategories = this.translateSubCategories(subCategories);
        this.offersService.getOffers().then((offers) => {
          this.offers = this.translateOffers(offers);
          this.readQueryParams();
        });
      });
    });
  }

  private translateCategories(categories: Category[]) {
    return categories.map((category: Category) => {
      category.categoryName = this.translatableString.get(
        category.categoryName,
      );
      category.categoryDescription = this.translatableString.get(
        category.categoryDescription,
      );
      return category;
    });
  }

  private translateSubCategories(subCategories: SubCategory[]) {
    return subCategories.map((subCategory: SubCategory) => {
      subCategory.subCategoryName = this.translatableString.get(
        subCategory.subCategoryName,
      );
      subCategory.subCategoryDescription = this.translatableString.get(
        subCategory.subCategoryDescription,
      );
      return subCategory;
    });
  }

  private translateOffers(offers: Offer[]) {
    return offers.map((offer: Offer) => {
      offer.offerName = this.translatableString.get(offer.offerName);
      offer.offerDescription = this.translatableString.get(
        offer.offerDescription,
      );
      return offer;
    });
  }

  private readQueryParams() {
    this.route.queryParams.subscribe((params) => {
      if ('categoryID' in params) {
        this.category = this.categories.find(
          (category) => category.categoryID === Number(params.categoryID),
        );
      }
      if ('subCategoryID' in params) {
        this.subCategory = this.subCategories.find(
          (subCategory) =>
            subCategory.subCategoryID === Number(params.subCategoryID),
        );
      }
      if ('offerID' in params) {
        this.offer = this.offers.find(
          (offer) => offer.offerID === Number(params.offerID),
        );
      }
    });
  }

  public clickCategory(category: Category) {
    this.category = category;
    this.subCategory = null;
    this.offer = null;
    this.router.navigate(['/tabs/referral'], {
      queryParams: {
        categoryID: this.category.categoryID,
      },
    });
  }

  public clickSubCategory(subCategory: SubCategory) {
    this.subCategory = subCategory;
    this.offer = null;
    this.router.navigate(['/tabs/referral'], {
      queryParams: {
        categoryID: this.category.categoryID,
        subCategoryID: this.subCategory.subCategoryID,
      },
    });
  }

  public clickOffer(offer: Offer) {
    this.offer = offer;
    this.router.navigate(['/tabs/referral'], {
      queryParams: {
        categoryID: this.category.categoryID,
        subCategoryID: this.subCategory.subCategoryID,
        offerID: this.offer.offerID,
      },
    });
  }

  goBack() {
    if (this.offer) {
      this.clickSubCategory(this.subCategory);
    } else if (this.subCategory) {
      this.clickCategory(this.category);
    } else if (this.category) {
      this.category = null;
      this.router.navigate(['/tabs/referral']);
    }
  }
}
