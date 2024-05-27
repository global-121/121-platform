import { Injectable } from '@angular/core';
import { ProgramTab } from '../models/program.model';
import { PROGRAM_TABS_ORDER } from '../program-phase-order';

export class Tab {
  id: number;
  name: ProgramTab;
  labelKey: string;
  active?: boolean;
  disabled?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProgramTabService {
  public activePhaseName: ProgramTab;
  public tabs: Tab[];

  public async getProgramTabs(): Promise<Tab[]> {
    if (!this.tabs) {
      this.tabs = this.initializeProgramTabs();
    }
    this.updateTab();

    return this.tabs;
  }

  private initializeProgramTabs(): Tab[] {
    return PROGRAM_TABS_ORDER.map((tab) => ({
      id: tab.id,
      name: tab.name,
      labelKey: `page.program.tab.${tab.name}.label`,
    }));
  }

  private updateTab() {
    // Initially, `activePhase` will only contain `id` and `name` attributes from PROGRAM_TABS_ORDER definition:
    this.tabs = this.tabs.map((tab: Tab) => {
      tab.active = tab.name === ProgramTab.peopleAffected;
      return tab;
    });
  }
}
