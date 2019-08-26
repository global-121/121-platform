import { Component, OnInit } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-get-program-details',
  templateUrl: './get-program-details.component.html',
  styleUrls: ['./get-program-details.component.scss'],
})
export class GetProgramDetailsComponent implements OnInit {
  public program: any;
  public programTitle: string;
  public languageCode: string;

  constructor(
    public programsService: ProgramsServiceApiService,
    public storage: Storage
  ) { }

  ngOnInit() {
    this.storage.get('languageChoice').then(value => {
      this.languageCode = value ? value : 'en';
    });
  }



  public getProgramById(): any {
    this.storage.get('programChoice').then(value => {
      this.programsService.getProgramById(value).subscribe(response => {
        this.program = [];
        this.programTitle = response.title[this.languageCode];
        const details = ['description', 'distributionChannel'];
        for (const detail of details) {
          this.program.push({
            key: detail,
            value: response[detail][this.languageCode] ? response[detail][this.languageCode] : response[detail]
          });
        }
      });
    });
  }

}
