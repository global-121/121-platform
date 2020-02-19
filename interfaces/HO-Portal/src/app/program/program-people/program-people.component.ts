import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslateService } from '@ngx-translate/core';
import { Person } from 'src/app/models/person.model';
import { Program, InclusionCalculationType } from 'src/app/models/program.model';
import { formatDate } from '@angular/common';
import { UserRole } from 'src/app/auth/user-role.enum';

@Component({
  selector: 'app-program-people',
  templateUrl: './program-people.component.html',
  styleUrls: ['./program-people.component.scss'],
})
export class ProgramPeopleComponent implements OnChanges {
  @Input()
  public selectedPhase: string;

  @Input()
  public userRole: string;

  @Input()
  public programId: number;

  public componentVisible: boolean;
  private presentInPhases = [
    'design',
    'registration',
    'inclusion',
    'finalize',
    'payment',
    'evaluation'
  ];
  public userRoleEnum = UserRole;

  private locale: string;
  private dateFormat = 'yyyy-MM-dd, hh:mm';

  public showSensitiveData: boolean;

  public program: Program;

  public columns: any;
  public tableMessages: any;
  public submitWarning: any;

  public enrolledPeople: Person[] = [];
  public selectedPeople: any[] = [];
  private includedPeople: any[] = [];
  private newIncludedPeople: any[] = [];
  private newExcludedPeople: any[] = [];

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
      included: this.translate.instant('page.program.program-people.submit-warning-pa-included'),
      excluded: this.translate.instant('page.program.program-people.submit-warning-pa-excluded'),
      toIncluded: this.translate.instant('page.program.program-people.submit-warning-pa-to-included'),
      toExcluded: this.translate.instant('page.program.program-people.submit-warning-pa-to-excluded'),
    };
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedPhase && typeof changes.selectedPhase.currentValue === 'string') {
      this.checkVisibility(this.selectedPhase);
    }
    if (changes.userRole && typeof changes.userRole.currentValue === 'string') {
      this.shouldShowSensitiveData(this.userRole);
    }
    if (changes.programId && typeof changes.programId.currentValue === 'number') {
      this.update();
    }
  }

  private async update() {
    this.program = await this.programsService.getProgramById(this.programId);

    await this.shouldShowSensitiveData(this.userRole);

    this.determineColumns();

    this.loadData();
  }

  private async shouldShowSensitiveData(userRole) {
    this.showSensitiveData = userRole === this.userRoleEnum.PrivacyOfficer;
  }

  public checkVisibility(phase) {
    this.componentVisible = this.presentInPhases.includes(phase);
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
        name: this.translate.instant('page.program.program-people.column.person'),
        draggable: false,
        resizeable: false,
        sortable: false,
      },
      {
        prop: 'score',
        name: this.translate.instant('page.program.program-people.column.score'),
        draggable: false,
        resizeable: false,
      },
      {
        prop: 'created',
        name: this.translate.instant('page.program.program-people.column.created'),
        draggable: false,
        resizeable: false,
      },
      {
        prop: 'updated',
        name: this.translate.instant('page.program.program-people.column.updated'),
        draggable: false,
        resizeable: false,
      },
      {
        prop: 'selected',
        name: this.translate.instant('page.program.program-people.column.include'),
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
          name: this.translate.instant('page.program.program-people.column.name'),
          sortable: true,
          draggable: false,
          resizeable: false,
        },
        {
          prop: 'dob',
          name: this.translate.instant('page.program.program-people.column.dob'),
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
      .sort((a, b) => {
        if (a.score === b.score) {
          return (a.did > b.did) ? -1 : 1;
        } else {
          return (a.score > b.score) ? -1 : 1;
        }
      })
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

    if (this.showSensitiveData) {
      this.newIncludedPeople = this.selectedPeople.filter(x => !this.includedPeople.includes(x));
      this.newExcludedPeople = this.includedPeople.filter(x => !this.selectedPeople.includes(x));
    } else {
      this.newIncludedPeople = this.selectedPeople;
      this.newExcludedPeople = this.enrolledPeople.filter(x => !this.selectedPeople.includes(x));
    }

    const numIncluded: number = this.newIncludedPeople.length;
    const numExcluded: number = this.newExcludedPeople.length;

    this.submitWarning.message = `
      ${this.showSensitiveData ? this.submitWarning.toIncluded : this.submitWarning.included} ${numIncluded} <br>
      ${this.showSensitiveData ? this.submitWarning.toExcluded : this.submitWarning.excluded} ${numExcluded}
    `;

  }

  public async submitInclusion() {

    console.log('submitInclusion for:', this.newIncludedPeople);
    console.log('submitExclusion for:', this.newExcludedPeople);

    await this.programsService.include(this.programId, this.newIncludedPeople);
    await this.programsService.exclude(this.programId, this.newExcludedPeople);

    this.loadData();

    window.location.reload();
  }
}
