import {
  Component,
  Input,
  OnInit,
  Optional,
  ViewEncapsulation,
} from '@angular/core';
import { InstanceService } from 'src/app/services/instance.service';
import { environment } from 'src/environments/environment';

enum Actor {
  system = 'system',
  self = 'self',
}

@Component({
  selector: 'dialogue-turn',
  templateUrl: './dialogue-turn.component.html',
  styleUrls: ['./dialogue-turn.component.scss'],
  encapsulation: ViewEncapsulation.None, // Disabled to use the 'host-context'-level for `[dir='rtl']`-selector
})
export class DialogueTurnComponent implements OnInit {
  @Input()
  isSpoken = false;

  @Input()
  actor: Actor | string = Actor.system;

  @Input()
  actorName: string;

  @Input()
  avatarUrl: string;

  @Input()
  moment: Date;

  @Input()
  isConnected = false;

  isSelf: boolean;
  isSystem: boolean;

  animate = environment.useAnimation;

  constructor(@Optional() private instanceService: InstanceService) {}

  ngOnInit() {
    this.isSelf = this.actor === Actor.self;
    this.isSystem = this.actor === Actor.system;
    this.moment = new Date();
    this.getInstanceInformation();
  }

  private getInstanceInformation(): void {
    if (!this.instanceService) {
      return;
    }
    this.instanceService.instanceInformation.subscribe((instanceInfo) => {
      this.updateActor(
        instanceInfo.name,
        instanceInfo.displayName,
        instanceInfo.logoUrl,
      );
    });
  }

  private updateActor(
    newActor: Actor | string,
    actorName?: string,
    avatarUrl?: string,
  ): void {
    if (this.actor === Actor.system) {
      this.actor = newActor;
      this.actorName = actorName;
      this.avatarUrl = avatarUrl;
    }
  }

  public show(): void {
    this.isSpoken = true;
  }
}
