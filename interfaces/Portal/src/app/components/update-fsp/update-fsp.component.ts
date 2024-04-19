import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgModel } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { AnswerType } from '../../models/fsp.model';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { actionResult } from '../../shared/action-result';
import { CheckAttributeInputUtils } from '../../shared/utils/check-attribute-input.utils';

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
      this.fspList = this.fspList.map((fspItem) => ({
        ...fspItem,
        displayName: this.translatableString.get(fspItem.displayName),
      }));

      const selectedFsp = this.fspList.find(
        (fspItem) =>
          fspItem.displayName === this.translatableString.get(fspString),
      );

      if (selectedFsp) {
        this.selectedFspName = selectedFsp.fsp;
        this.selectedFspAttributes = selectedFsp.editableAttributes.map(
          (attr) => ({
            ...attr,
            shortLabel: this.translatableString.get(attr.shortLabel),
          }),
        );

        // Preload attributesToSave ..
        this.attributesToSave = this.selectedFspAttributes.reduce(
          (obj, key) => {
            obj[key.name] =
              //.. with prefilled value if available
              this.attributeValues[key.name] ||
              // .. and with empty string / null otherwise
              (key.type === AnswerType.Text ? '' : null);
            return obj;
          },
          {},
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

    this.checkAttributesCorrectlyFilled();
  }

  private checkAttributesCorrectlyFilled() {
    for (const attr of this.selectedFspAttributes) {
      if (
        !CheckAttributeInputUtils.isAttributeCorrectlyFilled(
          attr.type,
          attr.pattern,
          this.attributesToSave[attr.name],
        )
      ) {
        this.enableUpdateBtn = false;
        return;
      }
    }
    this.enableUpdateBtn = true;
  }
}
