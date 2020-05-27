import { Component, OnInit } from '@angular/core';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { TranslatableStringService } from '../services/translatable-string.service';
import { Program } from '../models/program.model';

@Component({
  selector: 'app-programs-list',
  templateUrl: './programs-list.component.html',
  styleUrls: ['./programs-list.component.scss'],
})
export class ProgramsListComponent implements OnInit {
  public items: Program[];

  constructor(
    private programsService: ProgramsServiceApiService,
    private translatableString: TranslatableStringService,
  ) {}

  async ngOnInit() {
    const programs = await this.programsService.getAllPrograms();
    this.items = this.translateProperties(programs);
  }

  private translateProperties(programs: Program[]): Program[] {
    return programs.map((program: Program) => {
      program.title = this.translatableString.get(program.title);
      program.description = this.translatableString.get(program.description);

      return program;
    });
  }
}
