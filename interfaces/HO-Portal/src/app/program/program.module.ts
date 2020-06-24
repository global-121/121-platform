import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ProgramsRoutingModule } from './program-routing.module';

import { ProgramComponent } from './program.component';

@NgModule({
  declarations: [ProgramComponent],
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
