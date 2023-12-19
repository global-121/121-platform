import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { PhaseNavigationComponent } from '../../program/phase-navigation/phase-navigation.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    RouterModule,
    PhaseNavigationComponent,
  ],
  selector: 'app-program-navigation',
  templateUrl: './program-navigation.component.html',
  styleUrls: ['./program-navigation.component.scss'],
})
export class ProgramNavigationComponent implements OnInit {
  public programId: number;

  public canViewMetrics: boolean;
  public canReadAidWorkers: boolean;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {
    this.programId = this.route.snapshot.params.id;
  }

  public async ngOnInit() {
    this.canReadAidWorkers = this.authService.hasPermission(
      this.programId,
      Permission.AidWorkerProgramREAD,
    );
    this.canViewMetrics = this.authService.hasPermission(
      this.programId,
      Permission.ProgramMetricsREAD,
    );
  }
}
