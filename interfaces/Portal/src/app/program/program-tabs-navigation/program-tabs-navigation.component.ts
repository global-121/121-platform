import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import {
  Phase,
  ProgramPhaseService,
} from 'src/app/services/program-phase.service';

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, RouterModule],
  selector: 'app-program-tabs-navigation',
  templateUrl: './program-tabs-navigation.component.html',
  styleUrls: ['./program-tabs-navigation.component.scss'],
})
export class ProgramTabsNavigationComponent implements OnInit {
  @Input()
  public programId: number;

  public programPhases: Phase[];

  constructor(private programPhaseService: ProgramPhaseService) {}

  async ngOnInit() {
    this.programPhases = await this.programPhaseService.getPhases();
  }
}
