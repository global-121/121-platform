import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { Program } from 'src/app/models/program.model';
import { ConversationService } from 'src/app/services/conversation.service';
import { IonicStorageTypes } from 'src/app/services/iconic-storage-types.enum';
import { NoConnectionService } from 'src/app/services/no-connection.service';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { ValidationComponents } from '../validation-components.enum';
import { ValidationComponent } from '../validation-components.interface';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss'],
})
export class MainMenuComponent implements ValidationComponent {
  public menuOptions: any;
  public optionChoice: string;
  public optionSelected: boolean;

  public noConnection = this.noConnectionService.noConnection$;

  private myPrograms: Program[];

  constructor(
    public translate: TranslateService,
    public conversationService: ConversationService,
    public router: Router,
    private storage: Storage,
    private noConnectionService: NoConnectionService,
    private authService: AuthService,
    private programsServiceApiService: ProgramsServiceApiService,
  ) {
    this.authService.authenticationState$.subscribe(() => {
      // Refresh all option when current logged in user changes
      this.ngOnInit();
    });
  }

  async ngOnInit() {
    const pendingUploadCount = await this.getPendingUploadCount();

    this.myPrograms = await this.getAllAssignedPrograms();

    this.menuOptions = [
      {
        id: ValidationComponents.downloadData,
        option: this.translate.instant('validation.main-menu.download-data'),
        disabled: !this.canDownloadData(),
        connectionRequired: true,
        visible: true,
      },
      {
        id: ValidationComponents.findByPhone,
        option: this.translate.instant('validation.main-menu.find-by-phone'),
        disabled: !this.canFindByPhone(),
        connectionRequired: false,
        visible: true,
      },
      {
        id: ValidationComponents.uploadData,
        option: this.translate.instant('validation.main-menu.upload-data'),
        counter: pendingUploadCount,
        disabled: !this.canUploadData() || !pendingUploadCount,
        connectionRequired: true,
        visible: true,
      },
    ];
  }

  private canDownloadData() {
    return this.myPrograms.some((program) => {
      return this.authService.hasAllPermissions(program.id, [
        Permission.RegistrationPersonalForValidationREAD,
      ]);
    });
  }

  private canFindByPhone() {
    return this.myPrograms.some((program) => {
      return this.authService.hasAllPermissions(program.id, [
        Permission.RegistrationPersonalSEARCH,
        Permission.RegistrationPersonalForValidationREAD,
      ]);
    });
  }

  private canUploadData() {
    return this.myPrograms.some((program) => {
      return this.authService.hasAllPermissions(program.id, [
        Permission.RegistrationPersonalUPDATE,
        Permission.RegistrationAttributeUPDATE,
      ]);
    });
  }

  private async getPendingUploadCount(): Promise<number> {
    const validatedData = await this.storage.get(
      IonicStorageTypes.validatedData,
    );
    return validatedData ? validatedData.length : 0;
  }

  private async getAllAssignedPrograms(): Promise<Program[]> {
    let myPrograms = await this.storage.get(IonicStorageTypes.myPrograms);
    if (!myPrograms) {
      const { programs } =
        await this.programsServiceApiService.getAllAssignedPrograms();
      myPrograms = programs;
      this.storage.set(IonicStorageTypes.myPrograms, myPrograms);
    } else {
      this.refreshAllAssignedPrograms();
    }
    return myPrograms;
  }

  private refreshAllAssignedPrograms(): void {
    this.programsServiceApiService
      .getAllAssignedPrograms()
      .then((programDto) => {
        this.storage.set(IonicStorageTypes.myPrograms, programDto.programs);
        this.myPrograms = programDto.programs;
      })
      .catch(({ error }) => {
        console.log('Failed to refresh assigned programs. Error:', error);
      });
  }

  public changeOption($event) {
    const optionChoice = $event.detail.value;
    this.optionChoice = optionChoice;
  }

  public submitOption() {
    this.optionSelected = true;
    this.complete();
  }

  getNextSection() {
    return this.optionChoice;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: ValidationComponents.mainMenu,
      data: {
        option: this.optionChoice,
      },
      next: this.getNextSection(),
    });
  }
}
