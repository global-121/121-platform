import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppRoutes } from 'src/app/app-routes.enum';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Input()
  public title: string;

  @Input()
  public showHome = false;

  @Input()
  public showHelp = false;

  public appRoute = AppRoutes;

  public programId: number;
  private program: Program;
  public subtitle: string;

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    private translatableString: TranslatableStringService,
  ) {
    this.programId = this.route.snapshot.params.id;
  }

  public async ngOnInit() {
    await this.loadProgramDetails();
  }

  private async loadProgramDetails() {
    if (!this.programId) {
      return;
    }
    this.program = await this.programsService.getProgramById(this.programId);
    this.subtitle = this.translatableString.get(this.program?.titlePortal);
  }
}
