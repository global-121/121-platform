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

  public programId: number;

  public columns: any;
  public tableMessages: any;

  public enrolledPeople: Person[] = [];
  public defaultSelection: Person[] = [];
  public selectedPeople: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    public translate: TranslateService
  ) {

    this.tableMessages = {
      emptyMessage: this.translate.instant('common.table.no-data'),
      totalMessage: this.translate.instant('common.table.total'),
      selectedMessage: this.translate.instant('common.table.selected'),
    };

    this.columns = [
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
        prop: 'selected',
        name: this.translate.instant('page.programs.program-people.column.include'),
        checkboxable: true,
        draggable: false,
        resizeable: false,
        sortable: false,
      },
    ];

  }

  async ngOnInit() {

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
