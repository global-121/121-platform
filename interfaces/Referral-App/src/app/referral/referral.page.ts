import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { HelpPage } from 'src/app/help/help.page';
import mockReferralPageData from 'src/app/mocks/referral-page-data.mock';
import { Category } from 'src/app/models/category.model';
import { AnalyticsEventName } from 'src/app/models/event-name.model';
import { Offer } from 'src/app/models/offer.model';
import { ReferralPageData } from 'src/app/models/referral-page-data';
import { SubCategory } from 'src/app/models/sub-category.model';
import { LoggingService } from 'src/app/services/logging.service';
import { OffersService } from 'src/app/services/offers.service';
import { ReferralPageDataService } from 'src/app/services/referral-page-data.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-referral',
  templateUrl: 'referral.page.html',
  styleUrls: ['referral.page.scss'],
})
export class ReferralPage implements OnInit {
  public region: string;
  public regions: string[] = environment.regions.trim().split(/\s*,\s*/);

  public offers: Offer[];
  public categories: Category[];
  public subCategories: SubCategory[];

  public category: Category;
  public subCategory: SubCategory;
  public offer: Offer;

  public referralPageData: ReferralPageData = mockReferralPageData;

  public readonly rootHref: string = '/';

  public loading: boolean = false;

  constructor(
    public offersService: OffersService,
    private route: ActivatedRoute,
    private router: Router,
    public modalController: ModalController,
    private loggingService: LoggingService,
    private referralPageDataService: ReferralPageDataService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.region = params['region'];
      this.loadReferralData();
    });
  }

  public getRegionHref() {
    return this.rootHref + this.region;
  }

  public isSupportedRegion() {
    return (
      this.region &&
      this.regions.includes(this.region.replace(/\-/g, ' ').toLowerCase())
    );
  }

  public toKebabCase = (string) => {
    return string
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map((word) => word.toLowerCase())
      .join('-');
  };

  private async loadReferralData() {
    if (this.isSupportedRegion()) {
      this.loading = true;
      this.referralPageData = await this.referralPageDataService.getReferralPageData(
        this.region,
      );
      this.categories = await this.offersService.getCategories(this.region);
      this.subCategories = await this.offersService.getSubCategories(
        this.region,
      );
      this.offers = await this.offersService.getOffers(this.region);
      this.readQueryParams();
      this.loading = false;
    }
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

  public clickCategory(category: Category, isBack: boolean = false) {
    this.category = category;
    this.subCategory = null;
    this.offer = null;
    this.loggingService.logEvent(
      AnalyticsEventName.ReferralCategoryClick,
      this.getLogProperties(isBack),
    );
    this.router.navigate([this.getRegionHref()], {
      queryParams: {
        categoryID: this.category.categoryID,
      },
    });
  }

  public clickSubCategory(subCategory: SubCategory, isBack: boolean = false) {
    this.subCategory = subCategory;
    this.offer = null;
    this.loggingService.logEvent(
      AnalyticsEventName.ReferralSubCategoryClick,
      this.getLogProperties(isBack),
    );
    this.router.navigate([this.getRegionHref()], {
      queryParams: {
        categoryID: this.category.categoryID,
        subCategoryID: this.subCategory.subCategoryID,
      },
    });
  }

  public clickOffer(offer: Offer, isBack: boolean = false) {
    this.offer = offer;
    this.loggingService.logEvent(
      AnalyticsEventName.ReferralOfferClick,
      this.getLogProperties(isBack),
    );
    this.router.navigate([this.getRegionHref()], {
      queryParams: {
        categoryID: this.category.categoryID,
        subCategoryID: this.subCategory.subCategoryID,
        offerID: this.offer.offerID,
      },
    });
  }

  goBack() {
    if (this.offer) {
      this.loggingService.logEvent(
        AnalyticsEventName.ReferralBackFromOffer,
        this.getLogProperties(true),
      );
      this.clickSubCategory(this.subCategory, true);
    } else if (this.subCategory) {
      this.loggingService.logEvent(
        AnalyticsEventName.ReferralBackFromSubCategory,
        this.getLogProperties(true),
      );
      this.clickCategory(this.category);
    } else if (this.category) {
      this.loggingService.logEvent(
        AnalyticsEventName.ReferralBackFromCategory,
        this.getLogProperties(true),
      );
      this.category = null;
      this.router.navigate([this.getRegionHref()]);
    }
  }

  getLogProperties(isBack: boolean) {
    const logParams: { [key: string]: any } = { isBack };
    if (this.offer) {
      logParams.offerName = this.offer.offerName;
    }
    if (this.subCategory) {
      logParams.subCategory = this.subCategory.subCategoryName;
    }
    if (this.category) {
      logParams.category = this.category.categoryName;
    }
    return logParams;
  }

  async openHelpModal() {
    this.loggingService.logEvent(
      AnalyticsEventName.ReferralHelpPageOpen,
      this.getLogProperties(false),
    );
    const helpModal = await this.modalController.create({
      component: HelpPage,
      componentProps: { region: this.region },
    });
    return await helpModal.present();
  }
}
