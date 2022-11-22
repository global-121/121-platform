import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Person } from '../../models/person.model';
import { Program } from '../../models/program.model';
import { Transaction } from '../../models/transaction.model';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { TranslatableStringService } from '../../services/translatable-string.service';

@Component({
  selector: 'app-recipient-details',
  templateUrl: './recipient-details.component.html',
  styleUrls: ['./recipient-details.component.scss'],
})
export class RecipientDetailsComponent implements OnInit {
  @Input()
  recipient: Person;

  @Input()
  program: Program;

  public labelAnswerMap = new Map<string, string>();
  public transactions: Transaction[] = [];
  private keysToExclude = [
    'id',
    'data',
    'name',
    'paTableAttributes',
    'hasPhoneNumber',
    'referenceId',
    'programId',
  ];

  constructor(
    private translatableString: TranslatableStringService,
    private translate: TranslateService,
    private programsServiceApiService: ProgramsServiceApiService,
  ) {}

  async ngOnInit() {
    console.log('this.recipient: ', this.recipient);
    console.log('this.program: ', this.program);
    this.mapToKeyValue();
    await this.getTransactions();
  }

  private mapToKeyValue() {
    const translationPrefix = 'recipient-details.';
    for (const key of Object.keys(this.recipient)) {
      if (this.keysToExclude.includes(key)) {
        continue;
      }
      const translationKey = translationPrefix + key;
      const label = this.translate.instant(translationKey);
      // Add ' label !== translationKey && ' to this if when the translations for date columns are fixed
      if (this.recipient[key]) {
        this.labelAnswerMap.set(label, this.recipient[key]);
      }
    }
    for (const key of Object.keys(this.recipient.paTableAttributes)) {
      let label = '';
      const question = this.program.programQuestions.find(
        (q) => q.name === key,
      );
      if (question && this.recipient.paTableAttributes[key]) {
        label = this.translatableString.get(question.shortLabel);
        if (label) {
          this.labelAnswerMap.set(
            label,
            this.recipient.paTableAttributes[key].value,
          );
        }
      }
    }
  }

  private async getTransactions() {
    this.transactions = await this.programsServiceApiService.getTransactions(
      this.program.id,
      null,
      this.recipient.referenceId,
    );
  }
}
