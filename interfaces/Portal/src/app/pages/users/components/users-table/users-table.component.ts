import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { StatusName, TableData, UserType } from 'src/app/models/user.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SharedModule } from 'src/app/shared/shared.module';

interface NewTableData {
  status: StatusName;
  userType: UserType;
  id: number;
  lastLogin: string;
  username: string;
}

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [CommonModule, IonicModule, SharedModule, TranslateModule],
  templateUrl: './users-table.component.html',
  styleUrls: ['./users-table.component.scss'],
})
export class UsersTableComponent implements OnInit {
  @Input()
  set filterValue(value: string) {
    this.filterData(value);
  }

  DateFormat = DateFormat;
  rows: NewTableData[] = [];
  filteredRows: NewTableData[] = [];

  constructor(private programsService: ProgramsServiceApiService) {}

  ngOnInit() {
    this.loadData();
  }

  public async loadData() {
    const users: TableData[] = await this.programsService.getAllUsers();
    this.rows = this.filteredRows = this.modifiedData(users);
  }

  private filterData(value: string): void {
    if (this.rows && this.rows.length > 0) {
      if (value) {
        this.filteredRows = this.rows.filter(
          (v) =>
            this.checkIfIncludes(v.username, value) ||
            this.checkIfIncludes(v.userType, value) ||
            this.checkIfIncludes(v.status, value) ||
            this.checkIfIncludes(v.lastLogin, value),
        );
      } else {
        this.filteredRows = this.modifiedData(this.rows);
      }
    }
  }

  private modifiedData(value: TableData[] | NewTableData[]): NewTableData[] {
    return value.map((v) => ({
      ...v,
      status: v.active ? StatusName.active : StatusName.inactive,
      userType: v.admin ? UserType.admin : UserType.regular,
    }));
  }

  private checkIfIncludes(value: string, inputValue: string): boolean {
    return (value || '').toLowerCase().includes(inputValue.toLowerCase());
  }
}
