import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslateService } from '@ngx-translate/core';
import { Person } from 'src/app/models/person.model';

@Component({
  selector: 'app-program-people',
  templateUrl: './program-people.component.html',
  styleUrls: ['./program-people.component.scss'],
})
export class ProgramPeopleComponent implements OnInit {
  public languageCode: string;
  public fallbackLanguageCode: string;

  public programId: number;

  public columns: any;

  public enrolledPeople: Person[] = [];
  public defaultSelection: Person[] = [];
  public selectedPeople: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    public translate: TranslateService
  ) {

    this.columns = [
      {
        prop: 'pa',
        name: this.translate.instant('page.programs.program-people.column.person'),
        sortable: false,
      },
      {
        prop: 'score',
        name: this.translate.instant('page.programs.program-people.column.score'),
      },
      {
        prop: 'selected',
        name: this.translate.instant('page.programs.program-people.column.include'),
        headerCheckboxable: true,
        checkboxable: true,
        sortable: false,
      },
    ];

  }

  async ngOnInit() {
    this.fallbackLanguageCode = this.translate.getDefaultLang();
    this.languageCode = this.translate.currentLang;

    this.programId = Number(this.route.snapshot.params.id);

    this.enrolledPeople = this.createTableData(await this.programsService.getEnrolled(this.programId));

    this.selectedPeople = this.defaultSelectedPeople(this.enrolledPeople);
  }

  private createTableData(source: Person[]) {
    return source.map((person, index) => {
      return {
        pa: `PA #${index + 1}`,
        score: person.score,
        did: person.did
      };
    });
  }

  private defaultSelectedPeople(source: Person[]) {
    return source.filter((person) => (person.score >= 3));
  }

  public submitInclusion() {
    console.log('submitInclusion:', this.selectedPeople);

    this.programsService.include(this.programId, this.selectedPeople);
  }
}
