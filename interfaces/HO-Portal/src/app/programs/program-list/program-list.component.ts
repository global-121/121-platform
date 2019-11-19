import { Component, OnInit } from '@angular/core';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { Program } from '../../models/program.model';

@Component({
  selector: 'app-program-list',
  templateUrl: './program-list.component.html',
  styleUrls: ['./program-list.component.scss'],
})
export class ProgramListComponent implements OnInit {

  public items: Program[];

  constructor(
    private programsService: ProgramsServiceApiService
  ) {
  }

  ngOnInit() {
    this.programsService.getAllPrograms().subscribe(response => this.items = response);
  }

}
