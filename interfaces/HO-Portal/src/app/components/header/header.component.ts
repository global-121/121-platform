import { CommonModule } from '@angular/common';
import { Component,Input,OnInit } from '@angular/core';
import { ActivatedRoute,RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AppRoutes } from 'src/app/app-routes.enum';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { v4 as uuidv4 } from 'uuid';
import { UserStateComponent } from '../user-state/user-state.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    RouterModule,
    UserStateComponent,
  ],
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Input()
  public title: string;

  @Input()
  public isIframeHeader = false;

  public appRoute = AppRoutes;

  public menuId = uuidv4();
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
