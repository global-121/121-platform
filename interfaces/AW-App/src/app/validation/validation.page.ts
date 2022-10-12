import {
  Component,
  ComponentFactoryResolver,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { IonContent } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { AuthService } from '../auth/auth.service';
import { User } from '../models/user.model';
import { ConversationService } from '../services/conversation.service';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { DownloadDataComponent } from '../validation-components/download-data/download-data.component';
import { MainMenuComponent } from '../validation-components/main-menu/main-menu.component';
import { SelectProgramComponent } from '../validation-components/select-program/select-program.component';
import { UploadDataComponent } from '../validation-components/upload-data/upload-data.component';
import { ValidateFspComponent } from '../validation-components/validate-fsp/validate-fsp.component';
import { ValidateProgramComponent } from '../validation-components/validate-program/validate-program.component';
import { ValidationComponents } from '../validation-components/validation-components.enum';
import { FindByPhoneComponent } from './../validation-components/find-by-phone/find-by-phone.component';

@Component({
  selector: 'app-validation',
  templateUrl: 'validation.page.html',
  styleUrls: ['validation.page.scss'],
})
export class ValidationPage implements OnInit {
  @ViewChild(IonContent, { static: true })
  public ionContent: IonContent;

  @ViewChild('conversationContainer', { read: ViewContainerRef, static: true })
  public container;

  public isDebug: boolean = environment.isDebug;
  public showDebug: boolean = environment.isDebug
    ? this.debugCheckShowDebug()
    : false;

  private scrollSpeed = environment.useAnimation ? 600 : 0;

  public availableSections = {
    [ValidationComponents.selectProgram]: SelectProgramComponent,
    [ValidationComponents.mainMenu]: MainMenuComponent,
    [ValidationComponents.findByPhone]: FindByPhoneComponent,
    [ValidationComponents.validateProgram]: ValidateProgramComponent,
    [ValidationComponents.validateFsp]: ValidateFspComponent,
    [ValidationComponents.downloadData]: DownloadDataComponent,
    [ValidationComponents.uploadData]: UploadDataComponent,
  };
  public debugSections = Object.keys(this.availableSections);

  constructor(
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    private resolver: ComponentFactoryResolver,
    private storage: Storage,
    private authService: AuthService,
  ) {
    // Listen for completed sections, to continue with next steps
    this.conversationService.sectionCompleted$.subscribe((response: string) => {
      this.insertSection(response);
    });
    // Listen for scroll events
    this.conversationService.shouldScroll$.subscribe((toY: number) => {
      if (toY === -1) {
        return this.ionContent.scrollToBottom(this.scrollSpeed);
      }

      this.ionContent.scrollToPoint(0, toY, this.scrollSpeed);
    });
  }

  ngOnInit() {
    this.loadComponents();
  }

  ionViewDidEnter() {
    this.scrollDown();
  }

  private loadComponents() {
    const steps = this.conversationService.getConversationUpToNow();

    for (const step of steps) {
      this.insertSection(step.name);
    }
  }

  private getComponentFactory(name: string) {
    return this.resolver.resolveComponentFactory(this.availableSections[name]);
  }

  public insertSection(name: string) {
    if (!name) {
      return;
    }

    console.log('ValidationPage insertSection(): ', name);

    this.scrollDown();

    this.container.createComponent(this.getComponentFactory(name));
  }

  public scrollDown() {
    this.ionContent.scrollToBottom(this.scrollSpeed);
  }

  public debugShowPermissions() {
    this.authService.authenticationState$
      .subscribe((user: User | null) => {
        if (!user) {
          return;
        }
        const userPermissions = user.permissions.sort();

        let allPermissions = '';
        userPermissions.forEach((p) => (allPermissions += `${p}\n`));

        const userIdCard =
          `User: ${user.username}\n\n` +
          `Permissions: (${userPermissions.length})\n\n` +
          `${allPermissions}\n`;

        // tslint:disable:no-console
        console.info(userIdCard);
        window.alert(userIdCard);
      })
      .unsubscribe();
  }

  public debugClearAllStorage() {
    this.storage.clear();
    window.sessionStorage.clear();
  }

  private debugCheckShowDebug(): boolean {
    return (
      environment.showDebug || !!window.sessionStorage.getItem('showDebug')
    );
  }
  public debugToggleShowDebug() {
    this.showDebug = !this.showDebug;
    window.sessionStorage.setItem('showDebug', this.showDebug ? '1' : '');
  }
}
