import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [CommonModule, IonicModule, SharedModule, TranslateModule],
  templateUrl: './users-table.component.html',
  styleUrls: ['./users-table.component.scss'],
})
export class UsersTableComponent implements OnInit {
  rows = [
    {
      name: 'John',
      role: 'CVA Officer',
      status: 'Active',
      lastActivity: '23/01/22',
    },
    {
      name: 'Linda',
      role: 'Officer',
      status: 'Active',
      lastActivity: '05/09/22',
    },
  ];

  constructor() {}

  ngOnInit(): void {}
}
