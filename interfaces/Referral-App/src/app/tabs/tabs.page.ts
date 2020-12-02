import { Component } from '@angular/core';
import { LogoService } from 'src/app/services/logo.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
})
export class TabsPage {
  public validationDisabled = true;

  constructor(private logoService: LogoService) {}

  public getLogo = (): string => {
    return this.logoService.logo
      ? this.logoService.logo
      : 'assets/icons/red_cross.png';
  };
}
