import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { User } from 'src/app/models/user.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [CommonModule, IonicModule, SharedModule, TranslateModule],
  templateUrl: './users-table.component.html',
  styleUrls: ['./users-table.component.scss'],
})
export class UsersTableComponent implements OnInit {
  rows = [];

  constructor(private programsService: ProgramsServiceApiService) {}

  ngOnInit() {
    this.loadData();
  }

  public async loadData() {
    const users: User[] = await this.programsService.getAllUsers();
    this.rows = users;
  }
}
