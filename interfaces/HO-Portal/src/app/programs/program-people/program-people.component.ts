import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslateService } from '@ngx-translate/core';
import { Person } from 'src/app/models/person.model';
import { Program } from 'src/app/models/program.model';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-program-people',
  templateUrl: './program-people.component.html',
  styleUrls: ['./program-people.component.scss'],
})
export class ProgramPeopleComponent implements OnInit {

  private locale: string;

  public privacy: boolean;
  public programId: number;
  public program: Program;

  public columns: any;
  public tableMessages: any;

  public noConnections = false;
  public noConnectionsPrivacy = false;

  public enrolledPeople: Person[] = [];
  public selectedPeople: any[] = [];
  public includedPeople: any[] = [];

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
  }



  async ngOnInit() {

    // Determine version of page (Privacy Officer or not)
    this.privacy = this.route.snapshot.url[2].path === 'people-privacy';

    this.programId = Number(this.route.snapshot.params.id);
    this.program = await this.programsService.getProgramById(this.programId);

    this.determineColumns();

  }

  async ionViewWillEnter() {
    this.loadData();
  }

  private async loadData() {
    if (!this.privacy) {
      this.enrolledPeople = this.createTableData(await this.programsService.getEnrolled(this.programId));
      if (this.enrolledPeople.length) { this.selectedPeople = this.defaultSelectedPeople(this.enrolledPeople); }
    } else {
      this.enrolledPeople = this.createTableDataPrivacy(await this.programsService.getEnrolledPrivacy(this.programId));
      if (this.enrolledPeople.length) { this.selectedPeople = this.defaultSelectedPeoplePrivacy(this.enrolledPeople); }
    }
    this.includedPeople = [].concat(this.selectedPeople);
    console.log('Data loaded', this.includedPeople);
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
      }
    ];

    if (!this.privacy) {
      this.columns = columnsRegular;
    } else {
      this.columns = columnsRegular.concat(columnsPrivacy);
    }
  }

  private createTableData(source: Person[]) {
    if (source.length === 0) {
      this.noConnections = true;
      return [];
    } else {
      return source
        .sort((a, b) => (a.score > b.score) ? -1 : 1)
        .map((person, index) => {
          return {
            pa: `PA #${index + 1}`,
            score: person.score,
            created: formatDate(person.created, 'medium', this.locale),
            updated: formatDate(person.updated, 'medium', this.locale),
            did: person.did
          };
        });
    }

  }

  private createTableDataPrivacy(source: Person[]) {
    if (source.length === 0) {
      this.noConnectionsPrivacy = true;
      return [];
    } else {
      return source
        .sort((a, b) => (a.score > b.score) ? -1 : 1)
        .map((person, index) => {
          return {
            pa: `PA #${index + 1}`,
            score: person.score,
            created: formatDate(person.created, 'medium', this.locale),
            updated: formatDate(person.updated, 'medium', this.locale),
            name: person.name,
            dob: person.dob,
            did: person.did,
            included: person.included
          };
        });
    }
  }

  private defaultSelectedPeople(source: Person[]) {
    if (this.program.inclusionCalculationType === 'highestScoresX') {
      const nrToInclude = this.program.highestScoresX;
      // const nrToInclude = 3;
      return source.slice(0, nrToInclude);
    } else {
      const minimumScore = this.program.minimumScore;
      // const minimumScore = 20;
      return source.filter((person) => person.score >= minimumScore);
    }
  }

  private defaultSelectedPeoplePrivacy(source: Person[]) {
    return source.filter((person) => person.included);
  }

  public async submitInclusion() {

    if (!this.privacy) {

      const includedPeople = this.selectedPeople;
      console.log('submitInclusion:', includedPeople);
      await this.programsService.include(this.programId, includedPeople);

      const excludedPeople: any[] = this.enrolledPeople.filter(x => !this.selectedPeople.includes(x));
      console.log('submitExclusion:', excludedPeople);
      await this.programsService.exclude(this.programId, excludedPeople);

    } else {

      const changedToExcluded = this.includedPeople.filter(x => !this.selectedPeople.includes(x));
      console.log('submitChangedToExcluded:', changedToExcluded);
      await this.programsService.exclude(this.programId, changedToExcluded);

      const changedToIncluded = this.selectedPeople.filter(x => !this.includedPeople.includes(x));
      console.log('submitChangedToIncluded:', changedToIncluded);
      await this.programsService.include(this.programId, changedToIncluded);

    }

    this.loadData();

  }
}
