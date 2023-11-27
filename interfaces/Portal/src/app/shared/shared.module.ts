import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { HeaderComponent } from '../components/header/header.component';
import { MessageHistoryPopupComponent } from '../components/message-history-popup/message-history-popup.component';
import { ProgramCardComponent } from '../components/program-card/program-card.component';
import { ProgramNavigationComponent } from '../components/program-navigation/program-navigation.component';
import { SelectTypeaheadComponent } from '../components/select-typeahead/select-typeahead.component';
import { StatusTableFilterComponent } from '../components/status-table-filter/status-table-filter.component';
import { SystemNotificationComponent } from '../components/system-notification/system-notification.component';
import { UpdateFspComponent } from '../components/update-fsp/update-fsp.component';
import { UpdatePropertyItemComponent } from '../components/update-property-item/update-property-item.component';
import { UserStateComponent } from '../components/user-state/user-state.component';
import { IfPermissionsDirective } from '../directives/if-permissions.directive';
import { OnlyAllowedInputDirective } from '../directives/only-allowed-input.directive';
import { BulkImportComponent } from '../program/bulk-import/bulk-import.component';
import { DisableRegistrationComponent } from '../program/disable-registration/disable-registration.component';
import { EditPersonAffectedPopupComponent } from '../program/edit-person-affected-popup/edit-person-affected-popup.component';
import { ExportFspInstructionsComponent } from '../program/export-fsp-instructions/export-fsp-instructions.component';
import { ExportListComponent } from '../program/export-list/export-list.component';
import { ImportFspReconciliationComponent } from '../program/import-fsp-reconciliation/import-fsp-reconciliation.component';
import { PhaseNavigationComponent } from '../program/phase-navigation/phase-navigation.component';
import { PhaseNextComponent } from '../program/phase-next/phase-next.component';
import { ProgramPeopleAffectedComponent } from '../program/program-people-affected/program-people-affected.component';
import { TableFilterRowComponent } from '../program/table-filter-row/table-filter-row.component';
import { ConfirmPromptComponent } from './confirm-prompt/confirm-prompt.component';
import { DatetimePickerComponent } from './datetime-picker/datetime-picker.component';
import { FilePickerPromptComponent } from './file-picker-prompt/file-picker-prompt.component';
import { InputPromptComponent } from './input-prompt/input-prompt.component';
import { PasswordToggleInputComponent } from './password-toggle-input/password-toggle-input.component';
import { RefreshDataComponent } from './refresh-data/refresh-data.component';
import { TooltipComponent } from './tooltip/tooltip.component';

@NgModule({
  declarations: [
    BulkImportComponent,
    ConfirmPromptComponent,
    DisableRegistrationComponent,
    EditPersonAffectedPopupComponent,
    ExportFspInstructionsComponent,
    ExportListComponent,
    FilePickerPromptComponent,
    IfPermissionsDirective,
    ImportFspReconciliationComponent,
    InputPromptComponent,
    OnlyAllowedInputDirective,
    PasswordToggleInputComponent,
    PhaseNextComponent,
    ProgramPeopleAffectedComponent,
    RefreshDataComponent,
    SystemNotificationComponent,
    TooltipComponent,
    UpdateFspComponent,
    UpdatePropertyItemComponent,
    StatusTableFilterComponent,
    ProgramCardComponent,
    MessageHistoryPopupComponent,
    DatetimePickerComponent,
    TableFilterRowComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule,
    TranslateModule.forChild(),
    NgxDatatableModule,
    HeaderComponent,
    UserStateComponent,
    ProgramNavigationComponent,
    PhaseNavigationComponent,
    SelectTypeaheadComponent,
  ],
  exports: [
    BulkImportComponent,
    ConfirmPromptComponent,
    DisableRegistrationComponent,
    EditPersonAffectedPopupComponent,
    ExportFspInstructionsComponent,
    ExportListComponent,
    FilePickerPromptComponent,
    HeaderComponent,
    IfPermissionsDirective,
    ImportFspReconciliationComponent,
    InputPromptComponent,
    NgxDatatableModule,
    PasswordToggleInputComponent,
    PhaseNavigationComponent,
    PhaseNextComponent,
    ProgramNavigationComponent,
    ProgramPeopleAffectedComponent,
    RefreshDataComponent,
    RouterModule,
    SystemNotificationComponent,
    TooltipComponent,
    TranslateModule,
    UpdateFspComponent,
    UpdatePropertyItemComponent,
    UserStateComponent,
    StatusTableFilterComponent,
    ProgramCardComponent,
    MessageHistoryPopupComponent,
    TableFilterRowComponent,
  ],
})
export class SharedModule {}
