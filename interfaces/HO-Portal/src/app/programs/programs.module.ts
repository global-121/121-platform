import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProgramDetailsComponent } from './program-details/program-details.component';
import { ProgramFundsComponent } from './program-funds/program-funds.component';
import { ProgramJsonComponent } from './program-json/program-json.component';
import { ProgramListComponent } from './program-list/program-list.component';
import { ProgramPayoutComponent } from './program-payout/program-payout.component';
import { ProgramPeopleComponent } from './program-people/program-people.component';

import { ProgramsRoutingModule } from './programs-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

@NgModule({
  entryComponents: [
    ProgramJsonComponent
  ],
  declarations: [
    ProgramDetailsComponent,
    ProgramFundsComponent,
    ProgramJsonComponent,
    ProgramListComponent,
    ProgramPayoutComponent,
    ProgramPeopleComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ProgramsRoutingModule,
    TranslateModule.forChild(),
    NgxDatatableModule
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
})
export class ProgramsModule { }
