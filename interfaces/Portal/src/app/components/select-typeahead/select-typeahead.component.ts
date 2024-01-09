import { NgForOf, NgIf } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { IonicModule, IonSearchbar } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

export interface Item {
  name: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select-typeahead',
  standalone: true,
  imports: [NgIf, NgForOf, IonicModule, TranslateModule],
  templateUrl: './select-typeahead.component.html',
  styleUrls: ['./select-typeahead.component.css'],
})
export class SelectTypeaheadComponent implements OnInit, OnChanges {
  @Input()
  public label: string;

  @Input()
  public placeholder: string;

  @Input()
  public searchPlaceholder: string;

  @Input()
  public disabled = false;

  @Input()
  public size: 'cover' | 'auto' = 'cover';

  @Input()
  public multiple = false;

  @Input()
  public showBackdrop = false;

  @Input()
  public items: Item[] = [];

  @Input()
  public selection: Item[] = [];

  @Output()
  public selectionChange = new EventEmitter<Item[]>();

  @Output()
  public selectionCancel = new EventEmitter<void>();

  @ViewChild('searchbar')
  private searchbar: IonSearchbar;

  public triggerId: string;

  public filteredItems: Item[] = [];

  public workingSelectedValues: Item['name'][] = [];

  public isOpen = false;

  constructor() {
    this.triggerId = `typeahead-${Math.random().toString().slice(2)}`;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (
      (changes.items && changes.items.currentValue) ||
      (changes.selection && changes.selection.currentValue)
    ) {
      this.resetWorkingSelectedValues(this.selection);
    }
  }

  public ngOnInit() {
    this.resetWorkingSelectedValues(this.selection);
  }

  private resetWorkingSelectedValues(selection?: Item[]) {
    this.filteredItems = [...this.items];
    if (selection) {
      this.workingSelectedValues = [...selection.map((item) => item.name)];
    } else {
      this.workingSelectedValues = [];
    }
  }

  public onPresent() {
    this.isOpen = true;
  }

  public onDidPresent() {
    this.searchbar.setFocus();
  }

  public onDismiss($detail: { role?: 'backdrop' }) {
    if ($detail.role === 'backdrop') {
      this.cancelChanges();
    }
  }

  public cancelChanges() {
    this.selectionCancel.emit();
    this.isOpen = false;
    this.resetWorkingSelectedValues(this.selection);
  }

  public confirmChanges() {
    this.selection = this.items.filter((item) =>
      this.workingSelectedValues.includes(item.name),
    );

    this.selectionChange.emit(this.selection);
    this.isOpen = false;
    this.resetWorkingSelectedValues(this.selection);
  }

  public onSearchbarInput($event: InputEvent & { target: HTMLInputElement }) {
    this.filterList($event.target.value);
  }

  private filterList(searchQuery: string | undefined) {
    if (typeof searchQuery === 'undefined' || searchQuery === '') {
      return (this.filteredItems = [...this.items]);
    }

    const normalizedQuery = searchQuery.toLowerCase();

    return (this.filteredItems = this.items.filter((item) => {
      return item.label.toLowerCase().includes(normalizedQuery);
    }));
  }

  public trackItems(_index: number, item: Item) {
    return item.label;
  }

  public isChecked(value: string) {
    return this.workingSelectedValues.find((name) => name === value);
  }

  public getLabel(name: Item['name']) {
    const item = this.items.find((item) => item.name === name);

    return item ? item.label : '';
  }

  public onCheckboxChange(checked: boolean, inputItem: Item) {
    if (checked) {
      this.workingSelectedValues.push(inputItem.name);
      this.workingSelectedValues.sort();
    } else {
      this.workingSelectedValues = this.workingSelectedValues.filter(
        (name) => name !== inputItem.name,
      );
    }
  }
  public onRadioChange(name: Item['name']) {
    this.workingSelectedValues = [name];
  }

  public onRadioClick(name: Item['name']) {
    this.onRadioChange(name);
    this.confirmChanges();
  }
}
