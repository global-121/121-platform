import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ProgramsRoutingModule } from './program-routing.module';

import { ProgramComponent } from './program.component';
import { PhaseNavigationComponent } from './phase-navigation/phase-navigation.component';
import { PhaseNextComponent } from './phase-next/phase-next.component';
import { ProgramPeopleComponent } from './program-people/program-people.component';

@NgModule({
  declarations: [
    ProgramComponent,
    PhaseNavigationComponent,
    PhaseNextComponent,
    ProgramPeopleComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    ProgramsRoutingModule,
    TranslateModule.forChild(),
    NgxDatatableModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProgramsModule {}
