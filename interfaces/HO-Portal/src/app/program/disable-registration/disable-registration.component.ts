import { Component, Input, OnInit } from '@angular/core';
import { NgModel } from '@angular/forms';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-disable-registration',
  templateUrl: './disable-registration.component.html',
  styleUrls: ['./disable-registration.component.scss'],
})
export class DisableRegistrationComponent implements OnInit {
  @Input()
  public programId: number;
  public publishedStatus: any | NgModel;
  constructor(private programsService: ProgramsServiceApiService) {}
  public program: Program;

  async ngOnInit() {
    this.program = await this.programsService.getProgramById(this.programId);
    this.publishedStatus = this.program.published;
  }

  public async updateRegistrationStatus() {
    console.log('on change : ', this.publishedStatus);
    let dataObj = { published: this.publishedStatus };
    this.programsService.updateProgram(this.programId, dataObj);
  }
}
