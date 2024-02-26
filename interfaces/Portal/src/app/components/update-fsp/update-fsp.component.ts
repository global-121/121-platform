import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgModel } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { actionResult } from '../../shared/action-result';

@Component({
  selector: 'app-update-fsp',
  templateUrl: './update-fsp.component.html',
  styleUrls: ['./update-fsp.component.scss'],
})
export class UpdateFspComponent implements OnInit {
  @Input()
  public attributeValues: any = {};

  @Input()
  public label: string;

  @Input()
  public explanation: string;

  @Input()
  public type: string;

  @Input()
  public value: string;

  @Input()
  public placeholder: string | undefined;

  @Input()
  public isDisabled: boolean;

  @Input()
  public inProgress: boolean;

  @Input()
  public fspList: any[];

  @Input()
  public referenceId: string;

  @Input()
  public programId: number;

  @Output()
  updated: EventEmitter<string> = new EventEmitter<string>();

  public propertyModel: any | NgModel;
  public attributeModel: any | NgModel;

  constructor(
    private programsService: ProgramsServiceApiService,
    private alertController: AlertController,
    private translate: TranslateService,
    private translatableString: TranslatableStringService,
    private errorHandlerService: ErrorHandlerService,
  ) {}

  public startingAttributes: any[] = [];
  public selectedFspAttributes: any[] = [];
  public attributeDifference: any[] = [];
  public startingFspName = '';
  public selectedFspName = '';
  public attributesToSave: object = {};
  public enableUpdateBtn = true;

  ngOnInit() {
    this.propertyModel = this.value;
    this.startingFspName = this.value;
    this.getFspAttributes(this.value);
    this.startingAttributes = [...this.selectedFspAttributes];
    this.enableUpdateBtn = false;
  }

  public updateChosenFsp() {
    this.programsService
      .updateChosenFsp(
        this.referenceId,
        this.programId,
        this.selectedFspName,
        this.attributesToSave,
      )
      .then(
        () => {
          this.inProgress = false;
          actionResult(
            this.alertController,
            this.translate,
            this.translate.instant('common.update-success'),
            true,
          );
        },
        (error) => {
          this.inProgress = false;
          console.log('error: ', error);
          if (error && error.error) {
            const errorMessage = this.translate.instant(
              'common.error-with-message',
              {
                error: this.errorHandlerService.formatErrors(error),
              },
            );
            actionResult(this.alertController, this.translate, errorMessage);
          }
        },
      );
  }

  public onFspChange({ detail }) {
    this.getFspAttributes(detail.value);
    if (!this.selectedFspAttributes.length) {
      this.enableUpdateBtn = true;
    }
  }

  public getFspAttributes(fspString: string) {
    this.selectedFspAttributes = [];
    this.attributesToSave = {};
    if (this.fspList) {
      const selectedFsp = this.fspList.find(
        (fspItem) => fspItem.fspDisplayNamePortal === fspString,
      );

      if (selectedFsp) {
        this.selectedFspName = selectedFsp.fsp;
        this.selectedFspAttributes = selectedFsp.editableAttributes.map(
          (attr) => ({
            ...attr,
            shortLabel: this.translatableString.get(attr.shortLabel),
          }),
        );
      }

      this.attributeDifference = this.startingAttributes.filter(
        (attr) => !this.selectedFspAttributes.includes(attr),
      );
    }
  }

  public onAttributeChange(attrName, { detail }) {
    this.attributesToSave = {
      ...this.attributesToSave,
      [attrName]: detail.value.trim(),
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
