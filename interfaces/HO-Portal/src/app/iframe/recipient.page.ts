import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs';
import { Person } from '../models/person.model';
import { Program } from '../models/program.model';
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
  private paramsSubscription: Subscription;

  constructor(
    private activatedRoute: ActivatedRoute,
    private progamsServiceApiService: ProgramsServiceApiService,
  ) {
    this.paramsSubscription = this.activatedRoute.queryParams.subscribe(
      (params: Params) => {
        if (!params.phonenumber) {
          return;
        }
        this.queryParamPhonenumber = params.phonenumber;
      },
    );
  }

  async ngOnInit() {
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
  }

  ngOnDestroy(): void {
    this.paramsSubscription.unsubscribe();
  }

  private async getPhoneNumberDetails(phoneNumber: string): Promise<Person[]> {
    return await this.progamsServiceApiService.getPaByPhoneNr(phoneNumber);
  }
}
