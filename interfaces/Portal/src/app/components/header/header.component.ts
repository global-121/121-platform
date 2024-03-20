import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AppRoutes } from 'src/app/app-routes.enum';
import { AuthService } from 'src/app/auth/auth.service';
import { Program } from 'src/app/models/program.model';
import { User } from 'src/app/models/user.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { environment } from '../../../environments/environment';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { UserStateComponent } from '../user-state/user-state.component';

@Component({
  standalone: true,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    RouterModule,
    UserStateComponent,
    LanguageSwitcherComponent,
  ],
})
export class HeaderComponent implements OnInit {
  @Input()
  public title: string;

  @Input()
  public isIframeHeader = false;

  public appRoute = AppRoutes;

  public menuId = Math.floor(Math.random() * 100_000);
  public programId: number;
  private program: Program;
  public subtitle: string;
  public isAdmin?: boolean;

  public isCreateProgramEnabled = !!environment.create_program_endpoint;

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    private translatableString: TranslatableStringService,
    private authService: AuthService,
  ) {
    this.programId = this.route.snapshot.params.id;
  }

  public async ngOnInit() {
    await this.loadProgramDetails();
    this.authService.authenticationState$.subscribe((user: User | null) => {
      this.isAdmin = user?.isAdmin;
    });
  }

  private async loadProgramDetails() {
    if (!this.programId) {
      return;
    }
    this.program = await this.programsService.getProgramById(this.programId);
    this.subtitle = this.translatableString.get(this.program?.titlePortal);
  }
}
