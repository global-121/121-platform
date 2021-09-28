import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgModel } from '@angular/forms';

@Component({
  selector: 'app-update-fsp',
  templateUrl: './update-fsp.component.html',
  styleUrls: ['./update-fsp.component.scss'],
})
export class UpdateFspComponent implements OnInit {
  @Input()
  public label: string;

  @Input()
  public explanation: string;

  @Input()
  public type: string;

  @Input()
  public value: string;

  @Input()
  public placeholder: string;

  @Input()
  public isDisabled: boolean;

  @Input()
  public inProgress: boolean;

  @Input()
  public fspList: any[];

  @Output()
  updated: EventEmitter<string> = new EventEmitter<string>();

  public propertyModel: any | NgModel;

  constructor() {}

  public startingAttributes: any[] = [];
  public selectedFspAttributes: any[] = [];
  public attributeDifference: any[] = [];
  public startingFspName = '';
  public selectedFspName = '';
  public attributesToSave: {} = {};
  public enableUpdateBtn = true;

  ngOnInit() {
    this.propertyModel = this.value;
    this.startingFspName = this.value;
    this.getFspAttributes(this.value);
    this.startingAttributes = [...this.selectedFspAttributes];
    this.enableUpdateBtn = false;
  }

  public doUpdate() {
    console.log('this.selectedFspName:', this.selectedFspName);
    console.log('this.attributesToSave: ', this.attributesToSave);
  }

  public onFspChange({ detail }) {
    this.getFspAttributes(detail.value);
  }

  public getFspAttributes(fspString: string) {
    this.selectedFspAttributes = [];
    this.attributesToSave = {};
    this.selectedFspName = fspString;
    if (this.fspList) {
      const selectedFsp = this.fspList.find(
        (fspItem) => fspItem.fsp === this.selectedFspName,
      );

      if (selectedFsp) {
        this.selectedFspAttributes = selectedFsp.attributes;
      }

      this.attributeDifference = this.startingAttributes.filter(
        (attr) => !this.selectedFspAttributes.includes(attr),
      );
    }
  }

  public onAttributeChange({ target, detail }) {
    this.attributesToSave = {
      ...this.attributesToSave,
      [target.attributes['ng-reflect-name'].value]: detail.value.trim(),
    };

    this.checkAttributesFilled();
  }

  private checkAttributesFilled() {
    if (
      Object.values(this.attributesToSave).length <
        this.selectedFspAttributes.length ||
      Object.values(this.attributesToSave).includes('')
    ) {
      this.enableUpdateBtn = false;
      return;
    }

    this.enableUpdateBtn = true;
  }
}
