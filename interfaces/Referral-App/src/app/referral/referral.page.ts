import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Category } from 'src/app/models/category.model';
import { LoggingEvent } from 'src/app/models/logging-event.enum';
import { Offer } from 'src/app/models/offer.model';
import { ReferralPageData } from 'src/app/models/referral-page-data';
import { SubCategory } from 'src/app/models/sub-category.model';
import { LoggingService } from 'src/app/services/logging.service';
import { LogoService } from 'src/app/services/logo.service';
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

  public referralPageData: ReferralPageData;

  public readonly rootHref: string = '/';

  public loading = false;

  constructor(
    public offersService: OffersService,
    private route: ActivatedRoute,
    private router: Router,
    private loggingService: LoggingService,
    private referralPageDataService: ReferralPageDataService,
    private titleService: Title,
    private logoService: LogoService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.region = params.region;
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

  public toKebabCase(value: string) {
    return value
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map((word) => word.toLowerCase())
      .join('-');
  }

  private async loadReferralData() {
    if (this.isSupportedRegion()) {
      this.loading = true;
      this.referralPageData = await this.referralPageDataService.getReferralPageData(
        this.region,
      );
      this.titleService.setTitle(this.referralPageData.referralPageTitle);
      this.logoService.logo = this.referralPageData.referralPageLogo;
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

  private getNextSubCategory(category: Category) {
    const subCategories: SubCategory[] = this.subCategories.filter(
      (subCategory: SubCategory) => {
        return subCategory.categoryID === category.categoryID;
      },
    );
    return subCategories.length === 1 ? subCategories[0] : null;
  }

  public clickCategory(category: Category, isBack: boolean = false) {
    this.category = category;
    this.subCategory = isBack ? null : this.getNextSubCategory(category);
    this.offer = null;
    this.loggingService.logEvent(
      LoggingEvent.CategoryClick,
      this.getLogProperties(isBack),
    );
    this.router.navigate([this.getRegionHref()], {
      queryParams: {
        categoryID: this.category.categoryID,
        subCategoryID: this.subCategory ? this.subCategory.subCategoryID : null,
      },
    });
  }

  public clickSubCategory(subCategory: SubCategory, isBack: boolean = false) {
    this.subCategory = subCategory;
    this.offer = null;
    this.loggingService.logEvent(
      LoggingEvent.SubCategoryClick,
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
      LoggingEvent.OfferClick,
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
        LoggingEvent.BackFromOffer,
        this.getLogProperties(true),
      );
      this.clickSubCategory(this.subCategory, true);
    } else if (this.subCategory) {
      this.loggingService.logEvent(
        LoggingEvent.BackFromSubCategory,
        this.getLogProperties(true),
      );
      if (this.getNextSubCategory(this.category)) {
        this.category = null;
        this.subCategory = null;
        this.router.navigate([this.getRegionHref()]);
      } else {
        this.clickCategory(this.category);
      }
    } else if (this.category) {
      this.loggingService.logEvent(
        LoggingEvent.BackFromCategory,
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

  showCategories() {
    this.loggingService.logEvent(
      LoggingEvent.MainScreenClick,
      this.getLogProperties(true),
    );
    this.category = null;
    this.subCategory = null;
    this.offer = null;
    this.router.navigate([this.getRegionHref()]);
  }

  logContactClick(type: 'tel' | 'whatsapp') {
    let event = LoggingEvent.FooterContactClick;

    if (type === 'whatsapp') {
      event = LoggingEvent.FooterWhatsAppClick;
    }

    this.loggingService.logEvent(event, this.getLogProperties(true));
  }
}
