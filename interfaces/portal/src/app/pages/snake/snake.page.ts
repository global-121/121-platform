import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { SnakeComponent } from '~/pages/snake/game/snake.component';

@Component({
  selector: 'app-snake-page',
  imports: [PageLayoutComponent, SnakeComponent],
  templateUrl: './snake.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnakePageComponent {}
