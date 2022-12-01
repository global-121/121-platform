import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Person } from '../models/person.model';
import { Program } from '../models/program.model';
import { IframeService } from '../services/iframe.service';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';

@Component({
  selector: 'app-recipient-page',
  templateUrl: './recipient.page.html',
  styleUrls: ['./recipient.page.scss'],
})
export class RecipientPage implements OnInit, OnDestroy {
  public recipients: Person[];
  public programsMap: { [programId: number]: Program };
  public queryParamPhonenumber = '';
  public accordionGroupValue = undefined;
  public bannerText: string;
  private phoneNumberSubscription: Subscription;

  constructor(
    private progamsServiceApiService: ProgramsServiceApiService,
    private translate: TranslateService,
    private iframeService: IframeService,
  ) {
    this.phoneNumberSubscription =
      this.iframeService.phoneNumberChange$.subscribe((phoneNumber) => {
        console.log('phoneNumber OUTSIDE: ', phoneNumber);
        if (phoneNumber) {
          console.log('phoneNumber INSIDE: ', phoneNumber);
          this.queryParamPhonenumber = phoneNumber;
          this.getRecipientData();
        }
      });
  }

  async ngOnInit() {}

  ngOnDestroy(): void {
    this.phoneNumberSubscription.unsubscribe();
  }

  private async getRecipientData() {
    this.recipients = await this.getPhoneNumberDetails(
      this.queryParamPhonenumber,
    );

    if (this.recipients.length === 1) {
      this.accordionGroupValue = this.recipients[0].id;
    }

    const programs = await this.progamsServiceApiService.getAllPrograms();
    this.programsMap = {};
    for (const program of programs) {
      this.programsMap[program.id] = program;
    }
    this.recipients = this.recipients.map((recipient) => {
      recipient.name = recipient.name ? recipient.name : `PA #${recipient.id}`;
      return recipient;
    });

    this.bannerText =
      this.recipients.length > 1
        ? this.translate.instant(
            'page.iframe.recipient.multiple-recipients-found',
            { paCount: this.recipients.length },
          )
        : this.translate.instant(
            'page.iframe.recipient.single-recipient-found',
          );
  }

  private async getPhoneNumberDetails(phoneNumber: string): Promise<Person[]> {
    return await this.progamsServiceApiService.getPaByPhoneNr(phoneNumber);
  }
}
