import { Component, OnInit } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-select-program',
  templateUrl: './select-program.component.html',
  styleUrls: ['./select-program.component.scss'],
})
export class SelectProgramComponent implements OnInit {
  public programs: any;
  public programChoice: number;
  public program: any;
  public programTitle: string;

  constructor(
    public programsService: ProgramsServiceApiService,
    public storage: Storage
  ) { }

  public getProgramsByCountryId(): any {
    this.storage.get('countryChoice').then(value => {
      this.programsService.getProgramsByCountryId(value).subscribe(response => {
        this.programs = response;
      });
    });
  }

  ngOnInit() { }

}
