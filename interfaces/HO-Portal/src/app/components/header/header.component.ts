import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { UserRole } from 'src/app/auth/user-role.enum';
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

  public programId: number;
  private program: Program;
  public programTitle: string;

  public showManageAidworkers: boolean;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private programsService: ProgramsServiceApiService,
    private translatableString: TranslatableStringService,
  ) {
    this.programId = this.route.snapshot.params.id;

    this.showManageAidworkers = this.canManageAidWorkers();
  }

  ngOnInit() {
    this.loadProgramDetails();
  }

  private async loadProgramDetails() {
    this.program = await this.programsService.getProgramById(this.programId);
    this.programTitle = this.translatableString.get(this.program.title);
  }

  private canManageAidWorkers(): boolean {
    const userRoles = this.authService.getUserRoles();
    return userRoles.includes(UserRole.RunProgram);
  }
}
