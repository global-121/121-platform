import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxPopperModule } from 'ngx-popper';
import { HeaderComponent } from '../components/header/header.component';
import { UpdatePropertyItemComponent } from '../components/update-property-item/update-property-item.component';
import { UserStateComponent } from '../components/user-state/user-state.component';
import { BulkImportComponent } from '../program/bulk-import/bulk-import.component';
import { EditPersonAffectedPopupComponent } from '../program/edit-person-affected-popup/edit-person-affected-popup.component';
import { ExportListComponent } from '../program/export-list/export-list.component';
import { PhaseNavigationComponent } from '../program/phase-navigation/phase-navigation.component';
import { PhaseNextComponent } from '../program/phase-next/phase-next.component';
import { ProgramPeopleAffectedComponent } from '../program/program-people-affected/program-people-affected.component';
import { TestPaymentComponent } from '../program/test-payment/test-payment.component';
import { ConfirmPromptComponent } from './confirm-prompt/confirm-prompt.component';
import { FilePickerPromptComponent } from './file-picker-prompt/file-picker-prompt.component';
import { InputPromptComponent } from './input-prompt/input-prompt.component';
import { PasswordToggleInputComponent } from './password-toggle-input/password-toggle-input.component';
import { TooltipComponent } from './tooltip/tooltip.component';

@NgModule({
  declarations: [
    BulkImportComponent,
    ConfirmPromptComponent,
    EditPersonAffectedPopupComponent,
    ExportListComponent,
    FilePickerPromptComponent,
    HeaderComponent,
    InputPromptComponent,
    PasswordToggleInputComponent,
    PhaseNavigationComponent,
    PhaseNextComponent,
    ProgramPeopleAffectedComponent,
    TestPaymentComponent,
    TooltipComponent,
    UpdatePropertyItemComponent,
    UserStateComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule,
    TranslateModule.forChild(),
    NgxDatatableModule,
    NgxPopperModule.forRoot(),
  ],
  exports: [
    BulkImportComponent,
    ConfirmPromptComponent,
    EditPersonAffectedPopupComponent,
    ExportListComponent,
    FilePickerPromptComponent,
    HeaderComponent,
    InputPromptComponent,
    NgxDatatableModule,
    NgxPopperModule,
    PasswordToggleInputComponent,
    PhaseNavigationComponent,
    PhaseNextComponent,
    ProgramPeopleAffectedComponent,
    RouterModule,
    TestPaymentComponent,
    TooltipComponent,
    TranslateModule,
    UpdatePropertyItemComponent,
    UserStateComponent,
  ],
  entryComponents: [
    EditPersonAffectedPopupComponent,
    FilePickerPromptComponent,
    InputPromptComponent,
    TooltipComponent,
    UpdatePropertyItemComponent,
  ],
})
export class SharedModule {}
