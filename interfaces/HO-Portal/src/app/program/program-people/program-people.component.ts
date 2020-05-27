import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslateService } from '@ngx-translate/core';
import { Person } from 'src/app/models/person.model';
import {
  Program,
  InclusionCalculationType,
  ProgramPhase,
} from 'src/app/models/program.model';
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
  @Input()
  public refresh: boolean;
  @Output()
  isCompleted: EventEmitter<boolean> = new EventEmitter<boolean>();

  public componentVisible: boolean;
  private presentInPhases = [
    ProgramPhase.design,
    ProgramPhase.registrationValidation,
    ProgramPhase.inclusion,
    ProgramPhase.reviewInclusion,
    ProgramPhase.payment,
    ProgramPhase.evaluation,
  ];
  private activePhase: ProgramPhase;
  private locale: string;
  private dateFormat = 'yyyy-MM-dd, hh:mm';

  public showSensitiveData: boolean;

  public program: Program;
  private nrOfInstallments: number;

  public columns: any[] = [];
  private paymentColumns: any[] = [];
  public tableMessages: any;
  public submitWarning: any;

  public enrolledPeople: Person[] = [];
  private newEnrolledPeople: Person[] = [];
  public selectedPeople: any[] = [];
  private includedPeople: any[] = [];
  private newIncludedPeople: any[] = [];
  private newExcludedPeople: any[] = [];

  private includedLabel: string;
  private excludedLabel: string;

  private columnsAvailable = [
    {
      prop: 'pa',
      name: this.translate.instant('page.program.program-people.column.person'),
      draggable: false,
      resizeable: false,
      sortable: false,
      hidePhases: [],
    },
    {
      prop: 'processStarted',
      name: this.translate.instant(
        'page.program.program-people.column.process-started',
      ),
      draggable: false,
      resizeable: false,
      hidePhases: [],
    },
    {
      prop: 'digitalIdCreated',
      name: this.translate.instant(
        'page.program.program-people.column.digital-id-created',
      ),
      draggable: false,
      resizeable: false,
      hidePhases: [],
    },
    {
      prop: 'digitalIdValidated',
      name: this.translate.instant(
        'page.program.program-people.column.digital-id-validated',
      ),
      draggable: false,
      resizeable: false,
      hidePhases: [],
    },
    {
      prop: 'vulnerabilityAssessmentCreated',
      name: this.translate.instant(
        'page.program.program-people.column.vulnerability-assessment-created',
      ),
      draggable: false,
      resizeable: false,
      hidePhases: [],
    },
    {
      prop: 'vulnerabilityAssessmentValidated',
      name: this.translate.instant(
        'page.program.program-people.column.vulnerability-assessment-validated',
      ),
      draggable: false,
      resizeable: false,
      hidePhases: [],
    },
    {
      prop: 'score',
      name: this.translate.instant('page.program.program-people.column.score'),
      draggable: false,
      resizeable: false,
      hidePhases: [],
    },
    {
      prop: 'selected',
      name: this.translate.instant(
        'page.program.program-people.column.include',
      ),
      checkboxable: true,
      draggable: false,
      resizeable: false,
      sortable: false,
      hidePhases: [
        ProgramPhase.design,
        ProgramPhase.registrationValidation,
        ProgramPhase.inclusion,
        ProgramPhase.reviewInclusion,
        ProgramPhase.payment,
        ProgramPhase.evaluation,
      ],
    },
    {
      prop: 'included',
      name: this.translate.instant(
        'page.program.program-people.column.included',
      ),
      draggable: false,
      resizeable: false,
      disabled: true,
      sortable: false,
      hidePhases: [],
    },
    {
      prop: 'inclusionCommunication',
      name: this.translate.instant(
        'page.program.program-people.column.inclusion-communication',
      ),
      draggable: false,
      resizeable: false,
      hidePhases: [],
    },
    {
      prop: 'name',
      name: this.translate.instant('page.program.program-people.column.name'),
      sortable: true,
      draggable: false,
      resizeable: false,
      hidePhases: [],
      privacy: true,
    },
    {
      prop: 'dob',
      name: this.translate.instant('page.program.program-people.column.dob'),
      sortable: true,
      draggable: false,
      resizeable: false,
      hidePhases: [],
      privacy: true,
    },
  ];

  constructor(
    private programsService: ProgramsServiceApiService,
    public translate: TranslateService,
  ) {
    this.locale = this.translate.getBrowserCultureLang();

    this.includedLabel = this.translate.instant(
      'page.program.program-people.included',
    );
    this.excludedLabel = this.translate.instant(
      'page.program.program-people.excluded',
    );

    this.tableMessages = {
      emptyMessage: this.translate.instant('common.table.no-data'),
      totalMessage: this.translate.instant('common.table.total'),
      selectedMessage: this.translate.instant('common.table.selected'),
    };
    this.submitWarning = {
      message: '',
      included: this.translate.instant(
        'page.program.program-people.submit-warning-pa-included',
      ),
      excluded: this.translate.instant(
        'page.program.program-people.submit-warning-pa-excluded',
      ),
      toIncluded: this.translate.instant(
        'page.program.program-people.submit-warning-pa-to-included',
      ),
      toExcluded: this.translate.instant(
        'page.program.program-people.submit-warning-pa-to-excluded',
      ),
    };
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (
      changes.selectedPhase &&
      typeof changes.selectedPhase.currentValue === 'string'
    ) {
      this.checkVisibility(this.selectedPhase);
      this.update();
    }
    if (changes.userRole && typeof changes.userRole.currentValue === 'string') {
      this.shouldShowSensitiveData(this.userRole);
    }
    if (
      changes.programId &&
      typeof changes.programId.currentValue === 'number'
    ) {
      this.update();
    }
    if (
      this.programId &&
      changes.refresh &&
      typeof changes.refresh.currentValue === 'boolean'
    ) {
      this.update();
    }
  }

  private async update() {
    this.program = await this.programsService.getProgramById(this.programId);
    this.activePhase = ProgramPhase[this.program.state];
    this.nrOfInstallments = this.program.distributionDuration;

    this.shouldShowSensitiveData(this.userRole);

    await this.determineColumns();

    this.loadData();
  }

  private shouldShowSensitiveData(userRole) {
    this.showSensitiveData = userRole === UserRole.ProgramManager;
  }

  public checkVisibility(phase) {
    this.componentVisible = this.presentInPhases.includes(phase);
  }

  private checkPhaseReady() {
    const isReady =
      this.activePhase !== ProgramPhase.inclusion ||
      this.newEnrolledPeople.length === 0;

    this.isCompleted.emit(isReady);
  }

  public confirmBtnDisabled() {
    if (this.showSensitiveData) {
      return (
        this.enrolledPeople.length === 0 ||
        this.selectedPhase !== this.activePhase ||
        ![
          ProgramPhase.inclusion,
          ProgramPhase.reviewInclusion,
          ProgramPhase.payment,
        ].includes(ProgramPhase[this.activePhase])
      );
    } else {
      return (
        this.newEnrolledPeople.length === 0 ||
        this.activePhase !== ProgramPhase.inclusion ||
        this.selectedPhase !== ProgramPhase.inclusion
      );
    }
  }

  public checkNoConnectionsMessage() {
    return (
      !this.enrolledPeople.length && this.selectedPhase !== ProgramPhase.design
    );
  }

  private async determineColumns() {
    const columns = [];
    for (const column of this.columnsAvailable) {
      if (!this.showSensitiveData) {
        if (this.checkColumn(column)) {
          columns.push(column);
        }
      } else {
        if (this.checkColumnPrivacy(column)) {
          columns.push(column);
        }
      }
    }

    this.paymentColumns = this.addPaymentColumns();
    for (const column of this.paymentColumns) {
      columns.push(column);
    }

    this.columns = columns;
  }

  private checkColumn(column) {
    return (
      (!column.privacy &&
        !column.hidePhases.includes(ProgramPhase[this.selectedPhase])) ||
      (column.prop === 'selected' &&
        this.selectedPhase === this.activePhase &&
        ProgramPhase.inclusion === this.activePhase)
    );
  }

  private checkColumnPrivacy(column) {
    return (
      !column.hidePhases.includes(ProgramPhase[this.selectedPhase]) ||
      (column.prop === 'selected' &&
        this.selectedPhase === this.activePhase &&
        [
          ProgramPhase.inclusion,
          ProgramPhase.reviewInclusion,
          ProgramPhase.payment,
        ].includes(ProgramPhase[this.activePhase]))
    );
  }

  private addPaymentColumns() {
    const paymentColumns = [];
    for (let p = 0; p < this.nrOfInstallments; p++) {
      const column = {
        prop: 'payment' + (p + 1),
        name:
          this.translate.instant('page.program.program-people.column.payment') +
          ' #' +
          (p + 1),
        draggable: false,
        resizeable: false,
        hidePhases: [],
      };
      paymentColumns.push(column);
    }
    return paymentColumns;
  }

  private async loadData() {
    let allPeopleData: any[];

    if (this.showSensitiveData) {
      allPeopleData = await this.programsService.getEnrolledPrivacy(
        this.programId,
      );
      this.enrolledPeople = await this.createTableData(allPeopleData);
      this.selectedPeople = this.defaultSelectedPeoplePrivacy(
        this.enrolledPeople,
      );
    } else {
      allPeopleData = await this.programsService.getEnrolled(this.programId);
      this.enrolledPeople = await this.createTableData(allPeopleData);
      this.newEnrolledPeople = this.enrolledPeople.filter(
        (i) => !i.included && !i.excluded,
      );
      this.selectedPeople = this.defaultSelectedPeople(this.newEnrolledPeople);
    }

    this.includedPeople = [].concat(this.selectedPeople);

    this.checkPhaseReady();

    // Load initial values for warning-message:
    this.updateSubmitWarning();

    console.log('Data loaded');
  }

  private async createTableData(source: Person[]): Promise<any[]> {
    if (source.length === 0) {
      return [];
    }

    const pastInstallments = await this.programsService.getPastInstallments(
      this.programId,
    );

    return source
      .sort((a, b) => {
        if (a.score === b.score) {
          return a.did > b.did ? -1 : 1;
        } else {
          return a.score > b.score ? -1 : 1;
        }
      })
      .map((person, index) => {
        let personData: any = {
          pa: `PA #${index + 1}`,
          score: person.score,
          did: person.did,
          processStarted: formatDate(
            person.created,
            this.dateFormat,
            this.locale,
          ),
          digitalIdCreated: person.appliedDate
            ? formatDate(person.appliedDate, this.dateFormat, this.locale)
            : null,
          digitalIdValidated: person.validationDate
            ? formatDate(person.validationDate, this.dateFormat, this.locale)
            : null,
          vulnerabilityAssessmentCreated: person.appliedDate
            ? formatDate(person.appliedDate, this.dateFormat, this.locale)
            : null,
          vulnerabilityAssessmentValidated: person.validationDate
            ? formatDate(person.validationDate, this.dateFormat, this.locale)
            : null,
          inclusionCommunication: person.inclusionDate
            ? formatDate(person.inclusionDate, this.dateFormat, this.locale)
            : null,
          included: person.included
            ? this.includedLabel
            : person.excluded
            ? this.excludedLabel
            : '',
        };

        personData = this.fillPaymentColumns(personData, pastInstallments);

        if (person.name) {
          personData.name = person.name;
        }
        if (person.dob) {
          personData.dob = person.dob;
        }

        return personData;
      });
  }

  private fillPaymentColumns(
    personData: any[],
    pastInstallments: any[],
  ): any[] {
    this.paymentColumns.map((_, index) => {
      const payment = pastInstallments.find((i) => i.installment === index + 1);
      if (payment) {
        personData['payment' + (index + 1)] = formatDate(
          payment.installmentDate,
          this.dateFormat,
          this.locale,
        );
      }
    });
    return personData;
  }

  private defaultSelectedPeople(source: any[]): any[] {
    if (this.selectedPhase !== ProgramPhase.inclusion) {
      return [];
    }

    if (
      this.program.inclusionCalculationType ===
      InclusionCalculationType.highestScoresX
    ) {
      const nrToInclude = this.program.highestScoresX;

      return source.slice(0, nrToInclude);
    }

    const minimumScore = this.program.minimumScore;

    return source.filter((person) => person.score >= minimumScore);
  }

  private defaultSelectedPeoplePrivacy(source: any[]): any[] {
    if (
      this.selectedPhase !== this.activePhase ||
      ![
        ProgramPhase.inclusion,
        ProgramPhase.reviewInclusion,
        ProgramPhase.payment,
      ].includes(ProgramPhase[this.selectedPhase])
    ) {
      return [];
    }

    return source.filter((person) => person.included === this.includedLabel);
  }

  public showCheckbox(row) {
    return (
      !row.included || row.name // Show checkboxes only for new enrolled PA's in project-officer mode
    ); // OR always when in program-manager (where endpoint gives only in/excluded people anyway)
  }

  public updateSubmitWarning() {
    if (this.showSensitiveData) {
      this.newIncludedPeople = this.selectedPeople.filter(
        (x) => !this.includedPeople.includes(x),
      );
      this.newExcludedPeople = this.includedPeople.filter(
        (x) => !this.selectedPeople.includes(x),
      );
    } else {
      this.newIncludedPeople = this.selectedPeople;
      this.newExcludedPeople = this.newEnrolledPeople.filter(
        (x) => !this.selectedPeople.includes(x),
      );
    }

    const numIncluded: number = this.newIncludedPeople.length;
    const numExcluded: number = this.newExcludedPeople.length;

    this.submitWarning.message = `
      ${
        this.showSensitiveData
          ? this.submitWarning.toIncluded
          : this.submitWarning.included
      } ${numIncluded} <br>
      ${
        this.showSensitiveData
          ? this.submitWarning.toExcluded
          : this.submitWarning.excluded
      } ${numExcluded}
    `;
  }

  public async submitInclusion() {
    console.log('submitInclusion for:', this.newIncludedPeople);
    console.log('submitExclusion for:', this.newExcludedPeople);

    await this.programsService.include(this.programId, this.newIncludedPeople);
    await this.programsService.exclude(this.programId, this.newExcludedPeople);

    this.loadData();
  }
}
