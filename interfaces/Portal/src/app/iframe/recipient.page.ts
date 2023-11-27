import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Person } from '../models/person.model';
import { Program } from '../models/program.model';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { TranslatableStringService } from '../services/translatable-string.service';

class Recipient extends Person {
  programTitle?: string;
}

@Component({
  selector: 'app-recipient-page',
  templateUrl: './recipient.page.html',
  styleUrls: ['./recipient.page.scss'],
})
export class RecipientPage implements OnDestroy {
  public recipients: Recipient[];

  public queryParamPhonenumber = '';
  public accordionGroupValue = undefined;
  public searchResultText: string;

  private paramsSubscription: Subscription;
  private programsMap: { [programId: number]: Program };

  constructor(
    private progamsServiceApiService: ProgramsServiceApiService,
    private translate: TranslateService,
    private translatableString: TranslatableStringService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.paramsSubscription = this.activatedRoute.queryParams.subscribe(
      (params: Params) => {
        if (!params.phonenumber && !params.phoneNumber) {
          return;
        }
        this.queryParamPhonenumber = params.phonenumber || params.phoneNumber;
        this.getRecipientData();
      },
    );
  }

  ngOnDestroy(): void {
    this.paramsSubscription.unsubscribe();
  }

  private async getRecipientData() {
    this.recipients = await this.getPaDetailsByPhoneNumber(
      this.queryParamPhonenumber,
    );

    if (this.recipients.length === 1) {
      this.accordionGroupValue = this.recipients[0].id;
    }

    this.searchResultText = this.getSearchResultText(this.recipients.length);
  }

  private async createProgramsMap(): Promise<{
    [id: number]: Program;
  }> {
    const programsMap = {};

    const programs = await this.progamsServiceApiService.getAllPrograms();

    for (const program of programs) {
      programsMap[program.id] = program;
    }
    return programsMap;
  }

  private async getPaDetailsByPhoneNumber(
    phoneNumber: string,
  ): Promise<Recipient[]> {
    const paList =
      await this.progamsServiceApiService.getPaByPhoneNr(phoneNumber);

    if (!this.programsMap) {
      this.programsMap = await this.createProgramsMap();
    }

    return paList.map((pa) => {
      return {
        ...pa,
        name: pa.name ? pa.name : `PA #${pa.personAffectedSequence}`,
        programTitle: this.translatableString.get(
          this.programsMap[pa.programId].titlePortal,
        ),
        program: this.programsMap[pa.programId],
      } as Recipient;
    });
  }

  private getSearchResultText(resultCount: number): string {
    if (resultCount === 1) {
      return this.translate.instant(
        'page.iframe.recipient.single-recipient-found',
      );
    }
    return this.translate.instant(
      'page.iframe.recipient.multiple-recipients-found',
      { paCount: resultCount },
    );
  }
}
