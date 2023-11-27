import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule, IonicModule, SharedModule, TranslateModule],
  templateUrl: './roles-list.component.html',
  styleUrls: ['./roles-list.component.scss'],
})
export class RolesListComponent implements OnInit {
  public rolesList = [];

  constructor(private programsService: ProgramsServiceApiService) {}

  ngOnInit() {
    this.loadRoles();
  }

  public async loadRoles() {
    const roles = await this.programsService.getRoles();
    this.rolesList = roles;
  }
}
