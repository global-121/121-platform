import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { SelectCountryComponent } from './select-country/select-country.component';
import { SelectProgramComponent } from './select-program/select-program.component';
import { ComponentsService } from '../services/components.service';

@NgModule({
  declarations: [SelectCountryComponent, SelectProgramComponent],
  imports: [
    CommonModule,
    SharedModule
  ],
  entryComponents: [SelectCountryComponent, SelectProgramComponent],
  exports: [SelectCountryComponent, SelectProgramComponent],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [ComponentsService]
})
export class PersonalComponentsModule { }

