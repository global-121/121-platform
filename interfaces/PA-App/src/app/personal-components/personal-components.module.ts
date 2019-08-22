import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { SelectCountryComponent } from './select-country/select-country.component';
import { SelectProgramComponent } from './select-program/select-program.component';
import { ConversationService } from '../services/conversation.service';

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
  providers: [ConversationService]
})
export class PersonalComponentsModule { }

