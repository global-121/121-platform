import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Category } from 'src/app/models/category.model';
import { Offer } from 'src/app/models/offer.model';
import { SubCategory } from 'src/app/models/sub-category.model';
import { OffersService } from 'src/app/services/offers.service';

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
  ) {
    this.loadReferralData();
  }

  private loadReferralData() {
    this.offersService.getCategories().then((categories) => {
      this.categories = categories;
      this.offersService.getSubCategories().then((subCategories) => {
        this.subCategories = subCategories;
        this.offersService.getOffers().then((offers) => {
          this.offers = offers;
          this.readQueryParams();
        });
      });
    });
  }

  private readQueryParams() {
    this.route.queryParams.subscribe((params) => {
      if ('categoryID' in params) {
        this.category = this.categories.find(
          (category) => category.categoryID == params.categoryID,
        );
      }
      if ('subCategoryID' in params) {
        this.subCategory = this.subCategories.find(
          (subCategory) => subCategory.subCategoryID == params.subCategoryID,
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

  public clickOffer(offer: Offer) {
    this.offer = offer;
  }
}
