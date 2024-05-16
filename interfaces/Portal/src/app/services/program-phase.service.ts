import { Injectable } from '@angular/core';
import { ProgramTab } from '../models/program.model';
import { PROGRAM_TABS_ORDER } from '../program-phase-order';

export class Tabs {
  id: number;
  name: ProgramTab;
  labelKey: string;
  btnTextKey: string;
  active?: boolean;
  disabled?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProgramTabService {
  public activePhaseName: ProgramTab;
  public tabs: Tabs[];

  public async getProgramTabs(): Promise<Tabs[]> {
    if (!this.tabs) {
      this.tabs = this.initializeProgramTabs();
    }
    this.updateTab();

    return this.tabs;
  }

  private initializeProgramTabs(): Tabs[] {
    return PROGRAM_TABS_ORDER.map((tab) => ({
      id: tab.id,
      name: tab.name,
      labelKey: `page.program.tab.${tab.name}.label`,
      btnTextKey: `page.program.tab.${tab.name}.btnText`,
    }));
  }

  private updateTab() {
    // Initially, `activePhase` will only contain `id` and `name` attributes from PROGRAM_TABS_ORDER definition:
    // TODO: Phase needs to be renamed and
    this.tabs = this.tabs.map((phase: Tabs) => {
      phase.active = phase.name === ProgramTab.peopleAffected;
      return phase;
    });
  }

  public getPhaseByName(name: ProgramTab): Tabs {
    return this.tabs.find((phase) => phase.name === name);
  }
}
