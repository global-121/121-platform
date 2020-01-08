import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-program-people',
  templateUrl: './program-people.component.html',
  styleUrls: ['./program-people.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProgramPeopleComponent implements OnInit {
  public languageCode: string;
  public fallbackLanguageCode: string;

  public programId: string;

  public columns: any;
  public enrolledPeople = [];
  public defaultSelection = [];
  public selected = [];

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    public translate: TranslateService
  ) {
    this.columns = [
      { prop: 'pa', name: 'Person Affected', canAutoResize: false },
      { prop: 'score', name: 'Inclusion Score', canAutoResize: false },
      {
        prop: 'selected',
        name: 'Include',
        sortable: false,
        canAutoResize: true,
        draggable: false,
        resizable: false,
        headerCheckboxable: false,
        checkboxable: true,
        width: 30
      },
    ];


  }

  ngOnInit() {
    this.fallbackLanguageCode = this.translate.getDefaultLang();
    this.languageCode = this.translate.currentLang;

    this.programId = this.route.snapshot.paramMap.get('id');
    this.programsService.getEnrolled(this.programId).subscribe((response) => {
      this.enrolledPeople = this.createTableData(response);
      this.defaultSelection = this.defaultSelectedPeople(response);
    });
  }

  private createTableData(response) {
    const result = [];
    for (let index in response) {
      const nrPerson = +index + 1;
      const person = {
        pa: 'PA #' + nrPerson,
        score: response[index].score,
        did: response[index].did
      }
      result.push(person);
    }
    return result;
  }

  private defaultSelectedPeople(response) {
    const result = [];
    const nrIncluded = 3;
    for (let index in response) {
      const nrPerson = +index + 1;
      if (nrPerson <= nrIncluded) {
        const person = {
          pa: 'PA #' + nrPerson,
          score: response[index].score,
          did: response[index].did
        }
        result.push(person);
      }
    }
    return result;
  }
}
