import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslateService } from '@ngx-translate/core';
import { Person } from 'src/app/models/person.model';
import { Program } from 'src/app/models/program.model';

@Component({
  selector: 'app-program-people',
  templateUrl: './program-people.component.html',
  styleUrls: ['./program-people.component.scss'],
})
export class ProgramPeopleComponent implements OnInit {
  public languageCode: string;
  public fallbackLanguageCode: string;

  public programId: number;
  public program: Program;

  public columns: any;

  public enrolledPeople: Person[] = [];
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
    this.program = await this.programsService.getProgramById(this.programId);

    this.enrolledPeople = this.createTableData(await this.programsService.getEnrolled(this.programId));
    this.selectedPeople = this.defaultSelectedPeople(this.enrolledPeople);
  }

  private createTableData(source: Person[]) {
    return source
      .sort((a, b) => (a.score > b.score) ? -1 : 1)
      .map((person, index) => {
        return {
          pa: `PA #${index + 1}`,
          score: person.score,
          did: person.did
        };
      });
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

  public submitInclusion() {
    console.log('submitInclusion:', this.selectedPeople);

    this.programsService.include(this.programId, this.selectedPeople);
  }
}
