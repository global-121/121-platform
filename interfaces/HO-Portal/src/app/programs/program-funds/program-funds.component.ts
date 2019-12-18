import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { formatCurrency, formatDate } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ProgramFunds } from 'src/app/models/program-funds.model';

@Component({
  selector: 'app-program-funds',
  templateUrl: './program-funds.component.html',
  styleUrls: ['./program-funds.component.scss'],
})
export class ProgramFundsComponent implements OnChanges {
  @Input()
  public programId: number;

  @Input()
  private currencyCode = 'EUR';

  private locale: string;

  private totalRaised: number;
  private totalTransferred: number;
  private totalAvailable: number;
  private lastUpdated: string;

  public totalRaisedDisplay: string;
  public totalTransferredDisplay: string;
  public totalAvailableDisplay: string;
  public lastUpdatedDisplay: string;

  constructor(
    private translate: TranslateService,
    private programsService: ProgramsServiceApiService,
  ) {
    this.locale = this.translate.getBrowserCultureLang();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (typeof changes.programId.currentValue === 'number') {
      this.update();
    }
  }

  public async update() {
    const funds: ProgramFunds = await this.programsService.getFundsById(this.programId);

    this.totalRaised = funds.totalRaised;
    this.totalTransferred = funds.totalTransferred;
    this.totalAvailable = funds.totalAvailable;

    this.lastUpdated = funds.updated;

    this.render();
  }

  private render() {
    const symbol = `${this.currencyCode} `;

    this.totalRaisedDisplay = formatCurrency(this.totalRaised, this.locale, symbol, this.currencyCode);
    this.totalTransferredDisplay = formatCurrency(this.totalTransferred, this.locale, symbol, this.currencyCode);
    this.totalAvailableDisplay = formatCurrency(this.totalAvailable, this.locale, symbol, this.currencyCode);

    this.lastUpdatedDisplay = formatDate(this.lastUpdated, 'full', this.locale);
  }
}
