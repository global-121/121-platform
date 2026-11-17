import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { TableCellComponent } from '~/components/query-table/components/table-cell/table-cell.component';
import { ProgramUserWithRolesLabel } from '~/domains/program/program.model';
import { AccessGroupAttribute } from '~/pages/program-settings-team/program-settings-team.page';

@Component({
  selector: 'app-table-cell-user-access-groups',
  imports: [],
  template: `
    <span class="inline-flex items-center">
      <span>{{ label() }}</span>
      <!-- @for (level of label(); track $index; let last = $last) {
        <span>{{ level }}</span>
        @if (!last) {
          <span class="mx-1"><strong>/</strong></span>
        }
      } -->
    </span>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class TableCellUserAccessGroupsComponent implements TableCellComponent<
  ProgramUserWithRolesLabel,
  { accessGroupAttributes: AccessGroupAttribute[] }
> {
  readonly value = input.required<ProgramUserWithRolesLabel>();
  readonly context = input.required<{
    accessGroupAttributes: AccessGroupAttribute[];
  }>();

  readonly label = computed(() => {
    const accessGroupLabels: string[] = [];

    for (const userAccessGroup of this.value().accessGroups) {
      const attribute = this.context().accessGroupAttributes.find(
        (attr) =>
          attr.name === userAccessGroup.programRegistrationAttributeName,
      );
      if (!attribute) {
        continue;
      }

      const option = attribute.options?.find(
        (opt) => opt.option === userAccessGroup.value,
      );

      if (!option) {
        continue;
      }

      accessGroupLabels.push(option.label ?? option.option);
    }

    if (accessGroupLabels.length === 0) {
      accessGroupLabels.push('All');
    }

    // return accessGroupValues;
    return accessGroupLabels.join(' / ');
  });
}
