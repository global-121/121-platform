import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProgramListComponent } from './program-list/program-list.component';
import { ProgramFundsComponent } from './program-funds/program-funds.component';
import { ProgramDetailsComponent } from './program-details/program-details.component';
import { ProgramJsonComponent } from './program-json/program-json.component';

import { ProgramsRoutingModule } from './programs-routing.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  entryComponents: [
    ProgramJsonComponent
  ],
  declarations: [
    ProgramListComponent,
    ProgramFundsComponent,
    ProgramDetailsComponent,
    ProgramJsonComponent
  ],
  imports: [
    CommonModule,
    ProgramsRoutingModule,
    TranslateModule.forChild()
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
})
export class ProgramsModule { }
