import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslateService } from '@ngx-translate/core';
import { Person } from 'src/app/models/person.model';
import { Program, InclusionCalculationType } from 'src/app/models/program.model';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-program-people',
  templateUrl: './program-people.component.html',
  styleUrls: ['./program-people.component.scss'],
})
export class ProgramPeopleComponent implements OnInit {

  private locale: string;
  private dateFormat = 'yyyy-MM-dd, hh:mm';

  public showSensitiveData: boolean;

  public programId: number;
  public program: Program;

  public columns: any;
  public tableMessages: any;
  public submitWarning: any;

  public enrolledPeople: Person[] = [];
  public selectedPeople: any[] = [];
  private includedPeople: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    public translate: TranslateService
  ) {
    this.locale = this.translate.getBrowserCultureLang();

    this.tableMessages = {
      emptyMessage: this.translate.instant('common.table.no-data'),
      totalMessage: this.translate.instant('common.table.total'),
      selectedMessage: this.translate.instant('common.table.selected'),
    };
    this.submitWarning = {
      message: '',
      included: this.translate.instant('page.programs.program-people.submit-warning-pa-included'),
      excluded: this.translate.instant('page.programs.program-people.submit-warning-pa-excluded'),
    };
  }

  async ngOnInit() {
    this.programId = Number(this.route.snapshot.params.id);
    this.program = await this.programsService.getProgramById(this.programId);

    await this.shouldShowSensitiveData();

    this.determineColumns();

    this.loadData();
  }

  private async shouldShowSensitiveData() {
    return this.route.data.subscribe((result) => this.showSensitiveData = result.showSensitiveData);
  }

  private async loadData() {
    let allPeopleData: any[];

    if (this.showSensitiveData) {
      allPeopleData = await this.programsService.getEnrolledPrivacy(this.programId);
      this.enrolledPeople = this.createTableData(allPeopleData);
      this.selectedPeople = this.defaultSelectedPeoplePrivacy(this.enrolledPeople);
    } else {
      allPeopleData = await this.programsService.getEnrolled(this.programId);
      this.enrolledPeople = this.createTableData(allPeopleData);
      this.selectedPeople = this.defaultSelectedPeople(this.enrolledPeople);
    }

    this.includedPeople = [].concat(this.selectedPeople);

    // Load initial values for warning-message:
    this.updateSubmitWarning();

    console.log('Data loaded');
  }

  private determineColumns() {
    const columnsRegular = [
      {
        prop: 'pa',
        name: this.translate.instant('page.programs.program-people.column.person'),
        draggable: false,
        resizeable: false,
        sortable: false,
      },
      {
        prop: 'score',
        name: this.translate.instant('page.programs.program-people.column.score'),
        draggable: false,
        resizeable: false,
      },
      {
        prop: 'created',
        name: this.translate.instant('page.programs.program-people.column.created'),
        draggable: false,
        resizeable: false,
      },
      {
        prop: 'updated',
        name: this.translate.instant('page.programs.program-people.column.updated'),
        draggable: false,
        resizeable: false,
      },
      {
        prop: 'selected',
        name: this.translate.instant('page.programs.program-people.column.include'),
        checkboxable: true,
        draggable: false,
        resizeable: false,
        sortable: false,
      },
    ];
    this.columns = columnsRegular;

    if (this.showSensitiveData) {
      const columnsPrivacy = [
        {
          prop: 'name',
          name: this.translate.instant('page.programs.program-people.column.name'),
          sortable: true,
          draggable: false,
          resizeable: false,
        },
        {
          prop: 'dob',
          name: this.translate.instant('page.programs.program-people.column.dob'),
          sortable: true,
          draggable: false,
          resizeable: false,
        },
      ];

      this.columns = columnsRegular.concat(columnsPrivacy);
    }
  }

  private createTableData(source: Person[]): Person[] {
    if (source.length === 0) {
      return [];
    }

    return source
      .sort((a, b) => (a.score > b.score) ? -1 : 1)
      .map((person, index) => {
        const personData: any = {
          pa: `PA #${index + 1}`,
          score: person.score,
          did: person.did,
          created: formatDate(person.created, this.dateFormat, this.locale),
          updated: formatDate(person.updated, this.dateFormat, this.locale),
      };

        if (person.name) {
          personData.name = person.name;
        }
        if (person.dob) {
          personData.dob = person.dob;
        }
        if (person.included) {
          personData.included = person.included;
        }

        return personData;
      });
  }

  private defaultSelectedPeople(source: Person[]): Person[] {
    if (this.program.inclusionCalculationType === InclusionCalculationType.highestScoresX) {
      const nrToInclude = this.program.highestScoresX;

      return source.slice(0, nrToInclude);
    }

    const minimumScore = this.program.minimumScore;

    return source.filter((person) => person.score >= minimumScore);
  }

  private defaultSelectedPeoplePrivacy(source: Person[]): Person[] {
    return source.filter((person) => person.included);
  }

  public updateSubmitWarning() {
    const numIncluded: number = this.selectedPeople.length;
    const numExcluded: number = this.enrolledPeople.length - this.selectedPeople.length;

    this.submitWarning.message = `
      ${this.submitWarning.included} ${numIncluded} <br>
      ${this.submitWarning.excluded} ${numExcluded}
    `;
  }

  public async submitInclusion() {
    console.log('submitInclusion()');

    let newIncludedPeople;
    let newExcludedPeople;

    if (this.showSensitiveData) {
      newIncludedPeople = this.selectedPeople.filter(x => !this.includedPeople.includes(x));
      newExcludedPeople = this.includedPeople.filter(x => !this.selectedPeople.includes(x));
    } else {
      newIncludedPeople = this.selectedPeople;
      newExcludedPeople = this.enrolledPeople.filter(x => !this.selectedPeople.includes(x));
    }

    console.log('submitInclusion for:', newIncludedPeople);
    console.log('submitExclusion for:', newExcludedPeople);

    await this.programsService.include(this.programId, newIncludedPeople);
    await this.programsService.exclude(this.programId, newExcludedPeople);

    this.loadData();

  }
}
