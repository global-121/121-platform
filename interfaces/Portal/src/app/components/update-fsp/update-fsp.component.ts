import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgModel } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import FspName from 'src/app/enums/fsp-name.enum';
import { Person } from 'src/app/models/person.model';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { FinancialServiceProviderConfiguration } from '../../models/fsp.model';
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
  public value: FspName;

  @Input()
  public placeholder: string | undefined;

  @Input()
  public isDisabled: boolean;

  @Input()
  public inProgress: boolean;

  @Input()
  public programFspConfigList: FinancialServiceProviderConfiguration[];

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
  public startingFspName: string;
  public selectedFspName: string;
  public attributesToSave: object = {};
  public enableUpdateBtn = true;
  public reason = 'Financial service provider change';

  ngOnInit() {
    this.propertyModel = this.value;
    this.startingFspName = this.value;
    this.setSelectedFspAndPrepareDropdown(this.value);
    this.startingAttributes = [...this.selectedFspAttributes];
    this.enableUpdateBtn = false;
  }

  public updateChosenFsp() {
    const programFspConfigName: keyof Person =
      'programFinancialServiceProviderConfigurationName';

    this.programsService
      .updatePaAttribute(
        this.programId,
        this.referenceId,
        programFspConfigName,
        this.selectedFspName,
        this.reason,
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

  public onFspSelectionChange({ detail }) {
    this.setSelectedFspAndPrepareDropdown(detail.value);
    this.enableUpdateBtn = this.startingFspName !== this.selectedFspName;
  }

  public setSelectedFspAndPrepareDropdown(fspString: FspName) {
    if (this.programFspConfigList) {
      this.programFspConfigList = this.programFspConfigList.map(
        (programFspConfig) => ({
          ...programFspConfig,
          translatedLabel: this.translatableString.get(programFspConfig.label),
        }),
      );

      const selectedFsp = this.programFspConfigList.find(
        (fspItem) => fspItem.name === fspString,
      );

      if (selectedFsp) {
        this.selectedFspName = selectedFsp.name;
      }
    }
  }
}
