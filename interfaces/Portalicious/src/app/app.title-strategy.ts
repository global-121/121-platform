import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { environment } from '~environment';

@Injectable({ providedIn: 'root' })
export class CustomPageTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }
  override updateTitle(routerState: RouterStateSnapshot) {
    const title = this.buildTitle(routerState);

    const envName = environment.envName ? ` [ ${environment.envName} ]` : '';
    const appTitle = `121 Portal ${envName}`;

    if (title) {
      this.title.setTitle(`${title} | ${appTitle}`);
    } else {
      this.title.setTitle(appTitle);
    }
  }
}
