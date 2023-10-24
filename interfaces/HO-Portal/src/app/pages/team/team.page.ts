import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderComponent } from '../../components/header/header.component';
import { ProgramNavigationComponent } from '../../components/program-navigation/program-navigation.component';
import { ProgramTeamPage } from '../../program/program-team/program-team.component';

@Component({
  selector: 'app-team',
  templateUrl: './team.page.html',
  styleUrls: ['./team.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HeaderComponent,
    TranslateModule,
    ProgramNavigationComponent,
    ProgramTeamPage,
  ],
})
export class TeamPage {
  public programId = this.route.snapshot.params.id;

  constructor(private route: ActivatedRoute) {}
}
