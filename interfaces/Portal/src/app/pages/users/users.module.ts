import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { SharedModule } from '../../shared/shared.module';
import { RolesListComponent } from './rolesList/roles-list/roles-list.component';
import { UsersTableComponent } from './users-table/users-table.component';
import { UsersPage } from './users.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HttpClientModule,
    NgxDatatableModule,
    SharedModule,
    UsersTableComponent,
    RolesListComponent,
    RouterModule.forChild([
      {
        path: '',
        component: UsersPage,
      },
    ]),
    TranslateModule.forChild(),
  ],
  declarations: [UsersPage],
})
export class UsersPageModule {}
